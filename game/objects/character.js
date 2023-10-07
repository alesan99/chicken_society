//Character object, a 'chicken' with a collision box and the ability to move

class Character {
	//Initialize: x pos, y pos, width, height
	constructor (x, y, w, h) {
		this.x = x || 0
		this.y = y || 0

		this.w = w //Width
		this.h = h //Height

		this.speed = 100 //Speed (px/sec)
	}

	// Move: dt, direction normal x, direction normal y
	move(dt, nx, ny) {
		this.x += nx*this.speed*dt //TODO: Built in speed and JUST take in the direction
		this.y += ny*this.speed*dt
	}

	//TODO: Render
	draw() {

	}
}