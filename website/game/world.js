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
		this.oldArea = "hub" //Where did the player just come from? (Think warps)
	}

	load (area) {
		PHYSICSWORLD = new SpatialHash(canvasWidth, canvasHeight, 100)

		// Physics objects
		OBJECTS = {}
		OBJECTS["Character"] = {}

		// Initialize all characters
		CHARACTER = OBJECTS["Character"] //shorthand
		CHARACTER[0] = new Character(PHYSICSWORLD, canvasWidth/2, canvasHeight/2, PROFILE)
		
		PLAYER = CHARACTER[0]
		PLAYER_CONTROLLER = new Player(CHARACTER[0]) // Initialize Player controller

		// HUD
		CHAT = new ChatObject()

		this.loadArea(area)
	}

	// Load Area data; loads background image & objects
	loadArea (area) {
		this.oldArea = this.area
		this.area = area || "hub"
		
		OBJECTS["Warp"] = {}
		OBJECTS["Wall"] = {}
		OBJECTS["Wall"].dontUpdate = true
		PHYSICSWORLD.clear()

		// Area graphics
		BACKGROUND[this.area] = new RenderImage(`assets/areas/${this.area}.png`)
		BACKGROUNDIMG[this.area] = {}
		BACKGROUNDSPRITE[this.area] = {}
		BACKGROUNDANIM[this.area] = {}

		// Load Area data
		loadJSON(`assets/areas/${this.area}.json`, (data) => {
			// Load additional Sprites & Animations
			if (data.sprites) {
				for (const [name, s] of Object.entries(data.sprites)) {
					// TODO: Finish this.
					let img = s.image
					if (!BACKGROUNDIMG[this.area][img]) {
						BACKGROUNDIMG[this.area][img] = new RenderImage(`assets/areas/${img}`)
					}
					BACKGROUNDSPRITE[this.area][name] = new Sprite(BACKGROUNDIMG[this.area][img], s.framesx, s.framesy, s.ox, s.oy, s.qw, s.qh, s.ow, s.oh)
					BACKGROUNDSPRITE[this.area][name].drawx = s.x // Position on screen
					BACKGROUNDSPRITE[this.area][name].drawy = s.y
					BACKGROUNDSPRITE[this.area][name].y = s.worldy // Where is it in the world? (aka it is in front of chickens here)
					// If defined, play animation
					if (s.anim) {
						BACKGROUNDANIM[this.area][name] = new Animation(BACKGROUNDSPRITE[this.area][name], 0, 0)
						BACKGROUNDANIM[this.area][name].playAnimation(s.anim.frames, s.anim.delay, null)
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
					OBJECTS["Warp"][name] = new Warp(PHYSICSWORLD, warp.to, warp.from, warp.facing, warp.x, warp.y, warp.w, warp.h)
				}
				
				// Get spawn location
				for (const [i, obj] of Object.entries(OBJECTS["Warp"])) {
					if (obj.fromArea == this.oldArea) {
						PLAYER.setPosition(obj.frontx, obj.fronty)
						PLAYER.dir = obj.facing
					}
				}
			}
			// Load NPCS
			if (data.NPCs) {
				
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
		}

		// HUD
		CHAT.draw()
	}

	keyPress(key) {
		CHAT.keyPress(key)
	}

}

