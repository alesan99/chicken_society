// World state; Displays a location, has moving characters with collision. 
var PHYSICSWORLD
var OBJECTS
var CHARACTER
var PLAYER
var PLAYER_CONTROLLER
var NPCS
var CHAT
var OBJECTS
var DEBUGPHYSICS = false
var MINIGAME

class World {
	constructor (area="hub") {
		this.name = "world"
		this.area = area //Area name
		this.oldArea = area //Where did the player just come from? (Think warps)

		// Initialize Physics world
		PHYSICSWORLD = new SpatialHash(canvasWidth, canvasHeight, 100)

		// Load Quests
		QuestSystem.initialize()
		QuestSystem.start("tutorial") // Temporary.. needs a better home

		// Physics objects
		OBJECTS = {}
		OBJECTS["Character"] = {}
		OBJECTS["Pet"] = {}

		// Initialize all characters
		NPCS = {}
		CHARACTER = OBJECTS["Character"] //shorthand
		CHARACTER[0] = new Character(PHYSICSWORLD, canvasWidth/2, canvasHeight/2, PROFILE, this.area)
		
		PLAYER = CHARACTER[0]
		PLAYER_CONTROLLER = new Player(CHARACTER[0]) // Initialize Player controller

		// HUD
		CHAT = MENUS["chatMenu"]
		CHAT.load()

		// Minigames
		MINIGAME = new MinigameState()

		this.loadArea(area)
	}

	load () {

	}

	// Load Area data; loads background image & objects
	// (Area name, function to call after loading is successful)
	loadArea (area="hub", fromWarp, endFunc) {
		// Let server know player is moving
		NETPLAY.sendArea(area)

		this.oldArea = this.area
		this.area = area

		// Transport player to new area
		PLAYER.area = this.area
		PLAYER_CONTROLLER.reset(canvasWidth/2, canvasHeight/2, "down")
		
		// Clear any uneeded objects
		for (const [name, npc] of Object.entries(NPCS)) {
			// Delete all NPCs
			delete NPCS[name]
			delete OBJECTS["Character"][name]
		}
		OBJECTS["Warp"] = {}
		OBJECTS["Trigger"] = {}
		OBJECTS["Wall"] = {}
		OBJECTS["Wall"].dontUpdate = true
		PHYSICSWORLD.clear()

		this.findPlayersInArea(this.area)

		// Area graphics
		BACKGROUND[this.area] = new RenderImage(`assets/areas/${this.area}.png`)
		BACKGROUNDIMG[this.area] = {}
		BACKGROUNDSPRITE[this.area] = {}
		BACKGROUNDANIM[this.area] = {}

		// Load Area data
		// TODO: move this elsewhere because its messy
		loadJSON(`assets/areas/${this.area}.json`, (data) => {loadAreaFile(data, this.area, this.oldArea, fromWarp, endFunc)})
	}

	// Register an object as part of the physics world
	spawnObject(name, obj, id) {
		if (id === undefined) {
			id = 0
			while (OBJECTS[name].hasOwnProperty(id.toString())) {
				id++
			}
		}
		OBJECTS[name][id] = obj
		return obj
	}

	update (dt) {
		// Update objects
		PLAYER_CONTROLLER.update(dt)
		for (const [id, obj] of Object.entries(NPCS)) {
			obj.update(dt)
		}
		for (const [name, objList] of Object.entries(OBJECTS)) {
			let keysToDelete
			for (const [id, obj] of Object.entries(objList)) {
				if (obj.update) {
					obj.update(dt)
				}
				// Remove deleted objects
				if (obj.DELETED) {
					if (!keysToDelete) { keysToDelete = [] }
					keysToDelete.push(id);
				}
			}
			if (keysToDelete) {
				keysToDelete.forEach(key => {
					delete objList[key];
				});
			}
		}
		updatePhysics(OBJECTS, PHYSICSWORLD, dt)

		NETPLAY.update(dt)
		
		// Dialogue box
		DialogueSystem.update(dt)

		// Background element animations
		for (const [i, anim] of Object.entries(BACKGROUNDANIM[this.area])) {
			anim.update(dt)
		}

		// HUD
		CHAT.update(dt)
	}

	draw () {
		// Background
		DRAW.setColor(255,255,255)
		DRAW.image(BACKGROUND[this.area], null, 0, 0) //sprite

		// Draw objects in the correct order
		let drawQueue = []

		// Background elements
		for (const [i, sprite] of Object.entries(BACKGROUNDSPRITE[this.area])) {
			if (sprite.visible) {
				let isActive = true // Is it disabled
				if (sprite.condition) {
					isActive = checkCondition(sprite.condition)
				}

				if (isActive) {
					drawQueue.push(sprite)
				}
			}
		}

		// Draw objects
		for (const [id, obj] of Object.entries(CHARACTER)) {
			// if (obj.area == PLAYER.area) {
				drawQueue.push(obj)
			// }
		}
		for (const [id, obj] of Object.entries(OBJECTS["Pet"])) {
			// if (obj.area == PLAYER.area) {
				drawQueue.push(obj)
			// }
		}
		drawQueue.sort((a, b) => a.y - b.y);
		for (let i = 0; i < drawQueue.length; i++) {
			const obj = drawQueue[i];
			obj.draw()
		}

		// Draw plyaer movement cursor
		PLAYER_CONTROLLER.draw()

		// NPC how speechBubble responses
		for (const [id, obj] of Object.entries(NPCS)) {
			obj.draw()
		}


		// Show action bubble above clickable elements like NPCs
		for (const [id, obj] of Object.entries(OBJECTS["Trigger"])) {
			obj.draw()
		}

		// Draw object overlays
		for (let i = 0; i < drawQueue.length; i++) {
			const obj = drawQueue[i];
			if (obj.drawOver) {
				obj.drawOver()
			}
		}

		// Dialogue box
		DialogueSystem.draw()

		// DEBUG physics
		if (DEBUGPHYSICS) {
			drawPhysics(OBJECTS, PHYSICSWORLD)

			// Display click triggers
			DRAW.setColor(120,0,80,1.0)
			for (const [id, obj] of Object.entries(OBJECTS["Trigger"])) {
				if (obj.clickShape) {
					let r = obj.clickRegion // region
					DRAW.rectangle(obj.x+r.x, obj.y+r.y, r.w, r.h, "line")
				}
			}

			// Display Corrdinates
			let [mouseX, mouseY] = getMousePos()
			DRAW.setColor(255,255,255,1.0)
			DRAW.setFont(FONT.caption, 4)
			DRAW.text(`(${Math.floor(mouseX)}, ${Math.floor(mouseY)})`, mouseX+10, mouseY+20)
		}

		// HUD
		CHAT.draw()
	}

	// Received keyboard input
	keyPress(key, code) {
		// Dialogue
		if (DialogueSystem.keyPress(key)) {
			return true
		}

		// Control Player
		PLAYER_CONTROLLER.keyPress(key)
		
		CHAT.keyPress(key)
	}
	keyRelease(key, code) {
		// Control Player
		PLAYER_CONTROLLER.keyRelease(key)
	}

	// Recieved mouse input
	mouseClick(button, x, y) {
		if (CHAT.mouseClick(button, x, y)) {
			return true
		}

		// Dialogue
		if (DialogueSystem.mouseClick(button, x, y)) {
			return true
		}
		
		// NPC speechBubble responses
		for (const [id, obj] of Object.entries(NPCS)) {
			if (obj.click(button, x, y)) {
				return true
			}
		}

		// Pet interaction
		for (const [id, obj] of Object.entries(OBJECTS["Pet"])) {
			if (obj.click(button, x, y)) {
				return true
			}
		}
		
		// Click on click triggers
		for (const [id, obj] of Object.entries(OBJECTS["Trigger"])) {
			if (obj.click && obj.click(button, x, y)) {
				return true
			}
		}

		// Control player by dragging mouse button on screen
		PLAYER_CONTROLLER.mouseClick(button, x, y)
	}

	mouseRelease(button, x, y) {
		CHAT.mouseRelease(button, x, y)
		// NPC speechBubble responses
		for (const [id, obj] of Object.entries(NPCS)) {
			if (obj.clickRelease(button, x, y)) {
				return true
			}
		}
		PLAYER_CONTROLLER.mouseRelease(button, x, y)
	}

	findPlayersInArea(area) {
		// Find all players that are in an area and add an object for them
		let players = []
		for (const [id, playerData] of Object.entries(NETPLAY.playerList)) {
			if (playerData.area == area) {
				this.addPlayerToArea(id, playerData)
				players.push(playerData)
			} else {
				this.removePlayerFromArea(id)
			}
		}
		return players
	}

	addPlayerToArea(id, playerData) {
		// When a player join an area, create a character object for them
		// First, check if player is in -your- area. If they aren't, remove or don't create their character object.
		let chicken = playerData.chicken
		console.log(playerData.area, PLAYER.area)
		if (playerData.area == PLAYER.area) { // Player is in your area
			if (!CHARACTER[id]) {
				CHARACTER[id] = new Character(PHYSICSWORLD, chicken.x, chicken.y, playerData.profile, playerData.area)
				CHARACTER[id].area = playerData.area
				console.log("Created!")
				//CHARACTER[id].active = false // Disable collision checks. Should be enabled so collision is accurate even when information isn't being recieved.
			}
		} else { // Player is not in your area
			this.removePlayerFromArea(id)
		}
	}

	removePlayerFromArea(id) {
		// Remove player object
		if (CHARACTER[id]) {
			CHARACTER[id].destroy()
			delete CHARACTER[id]
		}
	}
}

