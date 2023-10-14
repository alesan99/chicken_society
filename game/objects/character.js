//Character object, a 'chicken' with a collision box and the ability to move

class Character {
	//Initialize: x pos, y pos, width, height
	constructor (x, y, w, h) {
		this.x = x || 0
		this.y = y || 0

		this.w = w //Width
		this.h = h //Height

		this.speed = 100 //Speed (px/sec)
		this.controller = false //Is it being controlled?

		this.area = "" //Current area
	}

	// Move: dt, direction normal x, direction normal y
	move(dt, nx, ny) {
		this.x += nx*this.speed*dt
		this.y += ny*this.speed*dt
	}

	//TODO: Render
	draw() {

	}
}