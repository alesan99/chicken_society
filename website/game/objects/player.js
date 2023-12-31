//Player object, listens to inputs to control another object

class Player {
	//Initialize: x pos, y pos, width, height
	constructor (obj) {
		this.obj = obj
		obj.controller = this

		// Inputs
		this.arrowKeys = {
			left: false,
			right: false,
			up: false,
			down: false
		}
		this.mouseHold = false

		// Which triggers is the player currently inside of?
		this.triggers = new Map()
	}

	// Update
	update(dt) {
		let char = this.obj

		// Handle movement inputs
		// If mouse button is being held, the player should be controlled by the mouse
		// Otherwise, use arrow key inputs
		if (this.mouseHold) {
			let [mx, my] = getMousePos()

			let targetX = mx-char.x
			let targetY = my-char.y + 20

			if ( ((char.x - mx)**2 + (char.y-20 - my)**2) >= char.speed**2*dt ) { // Don't move if already close enough to the target location
				let [dx, dy] = vec2Unit(targetX, targetY) //convert to direction normal
				this.obj.move(dx, dy)
			} else {
				this.obj.move(0, 0)
			}
		} else {
			let dx = 0
			let dy = 0
			if (this.arrowKeys.left) {
				dx += -1
			} else if (this.arrowKeys.right) {
				dx += 1
			}
			if (this.arrowKeys.up) {
				dy += -1
			} else if (this.arrowKeys.down) {
				dy += 1
			}
			[dx, dy] = vec2Unit(dx, dy) //convert to direction normal
			char.move(dx, dy)
		}
	}

	// Interact with nearby triggers
	interact() {
		let char = this.obj
		if (this.triggers.size > 0) {
			// Find closest trigger that player is overlapping
			let closestTrigger = false
			let closestDist = Infinity
			for (const [key, trigger] of this.triggers.entries()) {
				let dist = ((trigger.x-char.x)**2 + (trigger.y-(char.y-char.shape.h/2))**2)
				if (dist < closestDist) {
					closestTrigger = trigger
					closestDist = dist
				}
			}
			if (closestTrigger) {
				closestTrigger.doAction()
			}
		}
	}

	// Inputs
	keyPress(key) {
		switch (key) {
			// Movement
			case "ArrowLeft":
				this.arrowKeys.left = true
				break
			case "ArrowUp":
				this.arrowKeys.up = true
				break
			case "ArrowRight":
				this.arrowKeys.right = true
				break
			case "ArrowDown":
				this.arrowKeys.down = true
				break
			case " ":
				this.interact()
				break
			case "Space":
				this.interact()
				break
		}
	}
	keyRelease(key) {
		switch (key) {
			// Movement
			case "ArrowLeft":
				this.arrowKeys.left = false
				break
			case "ArrowUp":
				this.arrowKeys.up = false
				break
			case "ArrowRight":
				this.arrowKeys.right = false
				break
			case "ArrowDown":
				this.arrowKeys.down = false
				break
		}
	}

	mouseClick(button, x, y) {
		// Movement
		// Check if left mouse button is being held
		if (button == 0) {
			this.mouseHold = true
		}
	}
	mouseRelease(button, x, y) {
		// Movement
		// Check if left mouse button is being held
		if (button == 0) {
			this.mouseHold = false
		}
	}

	// Collide
	startCollide(name, obj) {
		let char = this.obj
		if (name == "Trigger") {
			this.triggers.set(obj, obj)
		}
	}

	stopCollide(name, obj) {
		let char = this.obj
		if (name == "Trigger") {
			this.triggers.delete(obj)
		}
	}
}