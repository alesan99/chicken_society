// World state; Displays a location, has moving characters with collision. 
var PHYSICSWORLD
var OBJECTS
var CHARACTER
var PLAYER
var PLAYER_CONTROLLER
var CHAT
var OBJECTS
var DEBUGPHYSICS = false

class World {
	constructor () {
		this.name = "world"
		this.area = "hub" //Area name
	}

	load (area) {
		PHYSICSWORLD = new SpatialHash(canvasWidth, canvasHeight, 100)

		// Physics objects
		OBJECTS = {}
		OBJECTS["Character"] = {}

		// Initialize all characters
		CHARACTER = OBJECTS["Character"] //shorthand
		CHARACTER[0] = new Character(PHYSICSWORLD, canvasWidth/2-40, canvasHeight/2, PROFILE)
		
		PLAYER = CHARACTER[0]
		PLAYER_CONTROLLER = new Player(CHARACTER[0]) // Initialize Player controller

		// HUD
		CHAT = new ChatObject()

		this.loadArea(area)
	}

	loadArea (area) {
		this.area = area || "hub"
		
		OBJECTS["Warp"] = {}
		OBJECTS["Wall"] = {}
		OBJECTS["Wall"].dontUpdate = true
		PHYSICSWORLD.clear()

		// Load Area data
		loadJSON(`assets/areas/${this.area}.json`, (data) => {
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
				let i = 0
				for (const warp of data.warps) {
					i++
					OBJECTS["Warp"][i] = new Warp(PHYSICSWORLD, ...warp)
				}
			}
		})
	}

	update (dt) {
		// Update objects
		PLAYER_CONTROLLER.update(dt)
		for (const [id, obj] of Object.entries(CHARACTER)) {
			obj.update(dt)
		}
		updatePhysics(OBJECTS, PHYSICSWORLD, dt)

		//TODO: Update Collision
		if (NETPLAY) {
			NETPLAY.update(dt)
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
		for (const [id, obj] of Object.entries(CHARACTER)) {
			drawQueue.push(obj)
		}
		drawQueue.sort((a, b) => a.y - b.y);
		for (let i = 0; i < drawQueue.length; i++) {
			const obj = drawQueue[i];
			if (obj.area == PLAYER.area) {
				obj.draw()
			}
		}

		// DEBUG physics
		if (DEBUGPHYSICS) {
			drawPhysics(OBJECTS, PHYSICSWORLD)
		}

		// HUD
		CHAT.draw()
	}

	keyPress(key) {
		CHAT.keyPress(key)
	}

}

