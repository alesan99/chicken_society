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
		QuestSystem.start("tutorial")

		// Physics objects
		OBJECTS = {}
		OBJECTS["Character"] = {}

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

		PLAYER.area = this.area
		
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

		// Area graphics
		BACKGROUND[this.area] = new RenderImage(`assets/areas/${this.area}.png`)
		BACKGROUNDIMG[this.area] = {}
		BACKGROUNDSPRITE[this.area] = {}
		BACKGROUNDANIM[this.area] = {}

		// Load Area data
		// TODO: move this elsewhere because its messy
		loadJSON(`assets/areas/${this.area}.json`, (data) => {
			// Load additional Sprites & Animations
			if (data.sprites) {
				for (const [name, s] of Object.entries(data.sprites)) {
					let img = s.image
					if (!BACKGROUNDIMG[this.area][img]) {
						BACKGROUNDIMG[this.area][img] = new RenderImage(`assets/areas/${img}`)
					}
					let sprite = new Sprite(BACKGROUNDIMG[this.area][img], s.framesx, s.framesy, s.qw, s.qh, s.ox, s.oy, s.sepx, s.sepy)
					BACKGROUNDSPRITE[this.area][name] = new DrawableSprite(sprite, null, s.x, s.y, s.worldy)
					// If defined, play animation
					if (s.anim) {
						BACKGROUNDANIM[this.area][name] = new Animation(sprite, 0, 0)
						BACKGROUNDANIM[this.area][name].playAnimation(s.anim.frames, s.anim.delay, null)
						BACKGROUNDSPRITE[this.area][name].anim = BACKGROUNDANIM[this.area][name]
					}
				}
			}
			// Load area walls
			// Go through each polygon & make wall
			if (data.walls) {
				let i = 0
				for (const poly of data.walls) {
					// Create wall object
					i++
					OBJECTS["Wall"][i] = new Wall(PHYSICSWORLD, ...poly)
				}
			}
			// Load warps
			if (data.warps) {
				for (const [name, warp] of Object.entries(data.warps)) {
					OBJECTS["Warp"][name] = new Warp(PHYSICSWORLD, warp.to, warp.from, name, warp.fromWarp, warp.facing, warp.x, warp.y, warp.w, warp.h)
				}
				
				// Get spawn location
				for (const [i, obj] of Object.entries(OBJECTS["Warp"])) {
					if ((obj.fromWarp && obj.fromWarp == fromWarp) || (obj.fromArea && obj.fromArea == this.fromArea)) {
						PLAYER.setPosition(obj.frontx, obj.fronty+PLAYER.shape.h/2)
						PLAYER.dir = obj.facing
					}
				}
			}
			// Load NPCS
			if (data.NPCs) {
				for (const [name, npc] of Object.entries(data.NPCs)) {
					OBJECTS["Character"][name] = new Character(PHYSICSWORLD, npc.x, npc.y, npc.profile, this.area)
					NPCS[name] = new NPC(OBJECTS["Character"][name], npc.dialogue, npc.facing, npc.roamRadius, npc.range, npc.clickRegion, npc.shop)
				}
			}
			
			// Load triggers
			if (data.triggers) {
				for (const [name, trig] of Object.entries(data.triggers)) {
					let func = false
					// trig.action is a string describing what the trigger should do, create a function based on that
					let action = trig.action
					if (trig.cost && trig.icon) {
						trig.icon.text = trig.cost
					}
					OBJECTS["Trigger"][name] = new Trigger(PHYSICSWORLD, trig.x, trig.y, null, trig.shape, trig.icon, trig.clickRegion)
					
					if (action == "minigame") {
						// Start minigame
						func = function() {
							// Does this trigger cost something?
							if (trig.cost) {
								removeNuggets(trig.cost)
							}

							PLAYER.static = true // Don't let player move
							Transition.start("wipeLeft", "out", 0.8, null, () => {
								OBJECTS["Trigger"][name].reset()
								setState(MINIGAME, trig.minigameName) // Start minigame after transition
								Transition.start("wipeRight", "in", 0.8, null, null)
							})
						}
					}

					OBJECTS["Trigger"][name].action = func
				}
			}

			// Call function passed to loadArea after loading is successful
			if (endFunc) {
				endFunc()
			}
		})
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
			for (const [id, obj] of Object.entries(objList)) {
				if (obj.update) {
					obj.update(dt)
				}
			}
		}
		updatePhysics(OBJECTS, PHYSICSWORLD, dt)

		NETPLAY.update(dt)

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
			drawQueue.push(sprite)
		}

		// Draw objects
		for (const [id, obj] of Object.entries(CHARACTER)) {
			if (obj.area == PLAYER.area) {
				drawQueue.push(obj)
			}
		}
		drawQueue.sort((a, b) => a.y - b.y);
		for (let i = 0; i < drawQueue.length; i++) {
			const obj = drawQueue[i];
			obj.draw()
		}

		// NPC how dialogue responses
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

		// DEBUG physics
		if (DEBUGPHYSICS) {
			drawPhysics(OBJECTS, PHYSICSWORLD)

			// Display click triggers
			DRAW.setColor(120,0,80,1.0)
			for (const [id, obj] of Object.entries(OBJECTS["Trigger"])) {
				if (obj.clickRegion) {
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
		
		// NPC dialogue responses
		for (const [id, obj] of Object.entries(NPCS)) {
			if (obj.replyButtons.length > 0) {
				for (const replyButton of obj.replyButtons) {
					if (replyButton.click()) {
						return true
					}
				}
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
		// NPC dialogue responses
		for (const [id, obj] of Object.entries(NPCS)) {
			if (obj.replyButtons.length > 0) {
				for (const replyButton of obj.replyButtons) {
					replyButton.clickRelease()
				}
			}
		}
		PLAYER_CONTROLLER.mouseRelease(button, x, y)
	}
}

