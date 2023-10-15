// World state; Displays a location, has moving characters with collision. 
var CHARACTER
var PLAYER
var PLAYER_CONTROLLER

class World {
	constructor (area) {
		this.name = "world"
		this.area = area || "hub" //Area name
	}

	load () {
		// Initialize all characters
		// TODO: Make these names less confusing, chicken maybe?
		CHARACTER = {}
		CHARACTER[0] = new Character(canvasWidth/2-60, canvasHeight/2-80, 120, 160, PROFILE.name)
		// Initialize Player controller
		PLAYER = CHARACTER[0]
		PLAYER_CONTROLLER = new Player(CHARACTER[0])
		//TODO: Dynamically load in and remove players from an online session

		//TODO: Area collision
		//WALLS = new Wall(this.area)

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
	}

	draw () {
		// Background
		//ctx.fillStyle = "white"
		//ctx.fillRect(0, 0, canvasWidth, canvasHeight)
        // TODO: load background depending on area
        ctx.drawImage(BACKGROUND.hub, 0, 0, canvasWidth, canvasHeight) //sprite

		// Draw objects
		for (const [id, obj] of Object.entries(CHARACTER)) {
			obj.draw()
		}
	}
}

