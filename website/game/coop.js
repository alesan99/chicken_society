// TODO: Visit other player's coops
// TODO: Wallpapers

const Coop = (function() {
	// Chicken Coop Furniture
	const functions = {
		initialize() {
			this.owner = false // Is the player the owner of the coop?

			this.furniture = false // is player placing furninture?
			this.furnitureItemId = false // id string
			this.furnitureItem = false // item data object
			this.furnitureObj = false // physics object for collision checking
			this.furnitureX = 0 // placing x
			this.furnitureY = 0 // placing y
			this.furnitureDir = "down"
			this.furnitureValidPosition = false // can the furniture be placed?
		},

		load(coopFurniture, owner=false) {
			this.owner = owner

			// Create objects for all saved furniture
			for (let i = 0; i < coopFurniture.length; i++) {
				let data = coopFurniture[i]
				let itemId = data.id

				WORLD.spawnObject("Furniture", new Furniture(PHYSICSWORLD, itemId, data.x, data.y, data.dir))
			}
		},

		update(dt) {
			// Moving furniture?
			if (this.furniture) {
				let [mx, my] = getMousePos()
				this.furnitureX = Math.floor(mx)
				this.furnitureY = Math.floor(my)

				this.furnitureObj.setPosition(this.furnitureX, this.furnitureY)
			}
		},

		draw() {
			// Moving furniture?
			if (this.furniture) {
				DRAW.setColor(0,0,0,1.0)
				DRAW.setFont(FONT.caption)
				DRAW.text("Rotate Furniture with E", 10, 30)
				DRAW.text("Place Furniture with Left Click", 10, 50)
				DRAW.text("Remove Furniture with Right Click", 10, 70)
			}
		},

		keyPress(key) {
			if (key == "e") {
				if (this.furniture) {
					let furnitureDirs = ["down", "left", "up", "right"]
					// Rotate furniture clockwise
					// find index of current dir, then get next dir
					let dirIndex = furnitureDirs.indexOf(this.furnitureDir)
					let nextDirIndex = (dirIndex+1) % furnitureDirs.length
					this.furnitureDir = furnitureDirs[nextDirIndex]
					this.furnitureObj.setDir(this.furnitureDir)
				}
			}
		},

		keyRelease(key) {

		},

		mouseClick(button, x, y) {
			// Furniture
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
		},

		mouseRelease(button, x, y) {
			
		},

		moveFurniture(itemId) {
			this.furniture = true
			this.furnitureItem = itemId
	
			this.furnitureDir = "down"
	
			// Create furniture item physics object
			this.furnitureObj = WORLD.spawnObject("Furniture", new Furniture(PHYSICSWORLD, itemId, 0, 0, this.furnitureDir))
			this.furnitureObj.static = false
		},

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
		},

		removeFurniture(x, y) {
			// Look for furniture at point (x, y)
			for (const [id, obj] of Object.entries(OBJECTS["Furniture"])) {
				if (obj.shape.checkInside(x-obj.x, y-obj.y)) {
					removeFurniture(obj.id, obj.x, obj.y)
					addItem("furniture", obj.id) // Add back to inventory

					// Remove furniture
					obj.destroy()
					return true
				}
			}
			return false
		}
	};
	
 return functions; })()