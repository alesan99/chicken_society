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
        // Initialize all character
        CHARACTER = []
        CHARACTER[1] = new Character(0, 0, 120, 160)
        // Initialize Player controller
        PLAYER = CHARACTER[1]
        PLAYER_CONTROLLER = new Player(CHARACTER[1])
        //TODO: Dynamically load in and remove players from an online session

        //TODO: Area collision
        //WALLS = new Wall(this.area)

    }

    update (dt) {
        // Update objects
        PLAYER_CONTROLLER.update(dt)

        //TODO: Update Collision
    }

    draw () {
        // Background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    
        // Render objects
        ctx.fillStyle = "black";
        ctx.fillRect(PLAYER.x, PLAYER.y, PLAYER.w, PLAYER.h) //collision
        ctx.drawImage(IMG.chicken, PLAYER.x, PLAYER.y, PLAYER.w, PLAYER.h) //sprite
    
        // Set the font and text color
        ctx.font = "30px Arial";
        ctx.fillStyle = "blue";
        ctx.fillText("Hello, World!", 50, 100);
    }
}

