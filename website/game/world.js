// World state; Displays a location, has moving characters with collision. 
var CHARACTER
var PLAYER
var PLAYER_CONTROLLER
var CHAT

class World {
	constructor (area) {
		this.name = "world"
		this.area = area || "hub" //Area name
	}

	load () {
		// Initialize all characters
		// TODO: Make these names less confusing, chicken maybe?
		CHARACTER = {}
		CHARACTER[0] = new Character(canvasWidth/2-40, canvasHeight/2, PROFILE)
		// Initialize Player controller
		PLAYER = CHARACTER[0]
		PLAYER_CONTROLLER = new Player(CHARACTER[0])

		//TODO: Area collision
		//WALLS = new Wall(this.area)

		// HUD
		CHAT = new ChatObject()
	}

	update (dt) {
		// Update objects
		PLAYER_CONTROLLER.update(dt)
		for (const [id, obj] of Object.entries(CHARACTER)) {
			obj.update(dt)
		}

		//TODO: Update Collision
		if (NETPLAY) {
			NETPLAY.update(dt)
		}

		// HUD
		CHAT.update(dt)
	}

	draw () {
		// Background
        // TODO: load background depending on area
		DRAW.setColor(255,255,255)
        DRAW.image(BACKGROUND.hub, null, 0, 0) //sprite

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

		// HUD
		CHAT.draw()
	}

	keyPress(key) {
		CHAT.keyPress(key)
	}

}

