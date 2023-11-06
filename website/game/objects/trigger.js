//Trigger; Whenever the player is over this area, it can activate an action like a dialogue or a quest progression

class Trigger extends PhysicsObject {
	//Initialize: x pos, y pos, shape in points
	constructor (spatialHash, x, y, action, points) {
		// Collision
		super(spatialHash,x,y)
		this.x = x || 0
		this.y = y || 0

		this.shape = new Shape(...points)

        this.action = action

		this.active = true
		this.static = true
		this.setPosition(null,null)
	}

    doAction() {
        this.action()
    }
    
	// Collision
	collide(name, obj, nx, ny) {
		return false
	}

    startCollide(name, obj, nx, ny) {
		if (name == "Character" && obj == PLAYER) {
            this.doAction()
		}
	}

    stopCollide(name, obj) {
    }
}