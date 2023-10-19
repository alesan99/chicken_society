// Warp object; Moves player to a different location when touched.

class Warp {
	//Initialize: x pos, y pos, width, height
	constructor (x, y, w, h, area) {
		// Collision
		this.x = x
		this.y = y
		this.w = w
		this.h = h

		this.area = area

		this.shape = [
			-this.w/2, -this.h/2,
			this.w/2, -this.h/2,
			this.w/2, this.h/2,
			-this.w/2, this.h/2
		]

		this.active = true
		this.static = true
	}

	// Debug draw
	draw () {
		DRAW.setColor(255,0,0,1.0)
		DRAW.rectangle(this.x, this.y, this.w, this.h) //collision
	}
}