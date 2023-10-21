// Warp object; Moves player to a different location when touched.

class Warp extends PhysicsObject {
	//Initialize: x pos, y pos, width, height
	constructor (x, y, w, h, area) {
		// Collision
		super(x,y)
		this.x = x
		this.y = y
		this.w = w
		this.h = h

		this.area = area

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
}