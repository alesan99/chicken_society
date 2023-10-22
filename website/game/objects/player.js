//Player object, listens to inputs to control another object

class Player {
	//Initialize: x pos, y pos, width, height
	constructor (obj) {
		this.obj = obj
		obj.controller = this
	}

	// Update
	update(dt) {
		//Handle movement inputs
		let dx = 0
		let dy = 0
		if (arrowKeys.left) {
			dx += -1
		} else if (arrowKeys.right) {
			dx += 1
		}
		if (arrowKeys.up) {
			dy += -1
		} else if (arrowKeys.down) {
			dy += 1
		}
		[dx, dy] = vec2Unit(dx, dy) //convert to direction normal
		this.obj.move(dx, dy)
	}
}