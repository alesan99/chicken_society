// Warp object; Moves player to a different location when touched.

class Warp extends PhysicsObject {
	//Initialize: x pos, y pos, width, height
	constructor (spatialHash,area, fromArea, facing, x, y, w, h) {
		// Collision
		super(spatialHash,x,y)
		this.x = x
		this.y = y
		this.w = w
		this.h = h

		this.area = area
		this.fromArea = fromArea
		this.facing = facing || "down" // Where is the warp/door facing?
		this.frontx = this.x // Where to place player when spawning from this warp
		this.fronty = this.y
		let offset = 40
		if (facing == "down") {
			this.fronty += (this.h+offset)
		} else if (facing == "up") {
			this.fronty -= (this.h+offset)
		} else if (facing == "left") {
			this.frontx -= (this.w+offset)
		} else if (facing == "right") {
			this.frontx += (this.w+offset)
		}

		this.shape = new Shape(
			-this.w/2, -this.h/2,
			this.w/2, -this.h/2,
			this.w/2, this.h/2,
			-this.w/2, this.h/2
		)

		this.active = true
		this.static = true
		this.setPosition(null,null)
	}

	collide (name, obj, nx, ny) {
		return false
	}

	startCollide (name, obj, nx, ny) {
		if (name == "Character" && obj == PLAYER) {
			this.doWarp(PLAYER)
		}
	}

	// Warp Player to area given to Warp
	doWarp (character) {
		PLAYER.static = true // Don't let player move when in the process of warping
		Transition.start("iris", "out", 0.6, [character.x, character.y-40], () => {
			// Load new area
			if (NETPLAY != false) {
				NETPLAY.sendArea(this.area)
			}
			WORLD.loadArea(this.area)
			Transition.start("fade", "in", 0.3, [character.x, character.y-40], () => {
				PLAYER.static = false // Let player move after transition is done
			})
		})
	}
}