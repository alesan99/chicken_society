//Wall, collides with other objects to stop them

class Wall extends PhysicsObject {
	//Initialize: x pos, y pos, width, height
	constructor (...points) {
		// Collision
		super(0,0)
		this.x = 0
		this.y = 0

		this.shape = new Shape(...points)

		this.objName = "Wall"
		this.active = true
		this.static = true
		this.setPosition(null,null)
	}
}