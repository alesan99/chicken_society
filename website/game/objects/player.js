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

		this.target = false
		this.targetX = 0
		this.targetY = 0
		this.targetTimer = 0

		// Which triggers is the player currently inside of?
		this.triggers = new Map()

		// Chicken Coop Furniture
		this.furniture = false // is player placing furninture?
		this.furnitureItemId = false // id string
		this.furnitureItem = false // item data object
		this.furnitureObj = false // physics object for collision checking
		this.furnitureX = 0 // placing x
		this.furnitureY = 0 // placing y
		this.furnitureDir = "down"
		this.furnitureValidPosition = false // can the furniture be placed?
	}

	// Update
	update(dt) {
		let char = this.obj

		// Handle movement inputs
		// If mouse button is being held, the player should be controlled by the mouse
		if (this.mouseHold) {
			let [mx, my] = getMousePos()

			this.target = true
			this.targetX = mx
			this.targetY = my
			this.targetTimer = 4.0
		}
		if (this.target) {
			let targetX = this.targetX
			let targetY = this.targetY + 20
			let targetDiffX = targetX - char.x
			let targetDiffY = targetY - char.y

			let [dx, dy] = vec2Unit(targetDiffX, targetDiffY) //convert to direction normal
			let futureX = char.x + dx*char.speed*dt
			let futureY = char.y + dy*char.speed*dt

			this.targetTimer -= dt

			if ((((targetX-futureX > 0) != (targetX-char.x > 0)) || ((targetY-futureY > 0) != (targetY-char.y > 0))) // Don't move anymore if crossing target coordinate
				|| (this.targetTimer < 0) ) { // Or don't move if target hasn't been reached in a while
				this.stop()
			} else {
				char.move(dx, dy)
			}
		// Otherwise, use arrow key inputs
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

		// Chicken Coop Furniture
		if (this.furniture) {
			let [mx, my] = getMousePos()
			this.furnitureX = Math.floor(mx)
			this.furnitureY = Math.floor(my)

			this.furnitureObj.setPosition(this.furnitureX, this.furnitureY)
		}
	}

	// Draw movement cursor
	draw() {
		if (this.target) {
			DRAW.setColor(255, 255, 255, 1.0)
			let x = this.targetX
			let y = this.targetY
			let scale = 0.8
			if (this.mouseHold) {
				scale = 1.0
			}
			DRAW.image(IMG.moveCursor, null, x, y, 0, scale, scale, 0.5, 0.5)
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
		if (getOpenMenu()) {
			return
		}
		switch (key) {
			// Movement
			case "ArrowLeft":
				this.arrowKeys.left = true
				this.target = false
				break
			case "ArrowUp":
				this.arrowKeys.up = true
				this.target = false
				break
			case "ArrowRight":
				this.arrowKeys.right = true
				this.target = false
				break
			case "ArrowDown":
				this.arrowKeys.down = true
				this.target = false
				break
			case " ":
				this.interact()
				break
			case "Space":
				this.interact()
				break
			case "e":
				if (this.furniture) {
					let furnitureDirs = ["down", "left", "up", "right"]
					// Rotate furniture
					// find index of current dir, then get next dir
					let dirIndex = furnitureDirs.indexOf(this.furnitureDir)
					let nextDirIndex = (dirIndex+1) % furnitureDirs.length
					this.furnitureDir = furnitureDirs[nextDirIndex]
					this.furnitureObj.setDir(this.furnitureDir)
				}
				this.obj.useItem()
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

	// Reset state of player and player controller when moving to new area
	reset(x, y, dir="down") {
		let char = this.obj
		// Teleport character
		char.setPosition(x, y)
		char.dir = dir
		char.flip = 1

		// Also teleport pet
		if (char.pet) {
			char.petObj.setPosition(x, y)
		}

		// Stop movement
		this.target = false
	}

	stop() {
		let char = this.obj
		// Stop movement
		this.target = false
		char.move(0, 0)
	}

	mouseClick(button, x, y) {
		// Chicken Coop Furniture
		if (button == 0 && this.furniture) {
			// Place furniture
			this.placeFurniture(this.furnitureItem)
			return true
		} else if (button == 2) {
			// Remove furniture
			// Don't need to check if area is "coop", there should be no furniture in other areas
			if (this.removeFurniture(x, y)) {
				return true
			}
		}

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

		// Chicken Coop Furniture
		// if (button == 0 && this.furniture) {
		// 	// Place furniture
		// 	this.placeFurniture(this.furnitureItem)
		// }
	}

	// Chicken Coop Furniture
	moveFurniture(itemId) {
		this.furniture = true
		this.furnitureItem = itemId

		this.furnitureDir = "down"

		// Create furniture item physics object
		this.furnitureObj = WORLD.spawnObject("Furniture", new Furniture(this.obj.spatialHash, itemId, 0, 0, this.furnitureDir))
		this.furnitureObj.static = false
	}

	placeFurniture(itemId) {
		let obj = this.furnitureObj
		if (obj.colliding > 0) {
			return false
		}

		let item = getItemData(itemId)

		this.furniture = false
		this.furnitureItem = false

		// Let go of furniture object
		this.furnitureX = Math.floor(this.furnitureX)
		this.furnitureY = Math.floor(this.furnitureY)
		this.furnitureObj.setPosition(this.furnitureX, this.furnitureY)
		this.furnitureObj.static = true

		placeFurniture(itemId, this.furnitureX, this.furnitureY, this.furnitureDir)
		removeItem("furniture", itemId) // Furniture has been placed, remove from inventory
	}

	removeFurniture(x, y) {
		// Look for furniture at point (x, y)
		for (const [id, obj] of Object.entries(OBJECTS["Furniture"])) {
			if (obj.shape.checkInside(x-obj.x, y-obj.y)) {
				removeFurniture(obj.id, obj.x, obj.y)
				console.log(obj.id)
				addItem("furniture", obj.id) // Add back to inventory

				// Remove furniture
				obj.destroy()
				return true
			}
		}
		return false
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