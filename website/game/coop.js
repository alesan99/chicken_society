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
				this.furnitureObj.updateStacking()
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
				// Rotate furniture that is being placed
				if (this.furniture) {
					this.rotateFurniture(1)
				}
			}
		},

		keyRelease(key) {

		},

		mouseClick(button, x, y) {
			// Furniture
			if (button == 0 && this.furniture) {
				// Place furniture (if currently placing furniture)
				this.placeFurniture(this.furnitureItem)
				return true
			} else if (button == 2 && !this.furniture) {
				// Remove furniture (if not currently placing furniture)
				// Don't need to check if area is "coop", there should be no furniture in other areas
				if (this.removeFurniture(x, y)) {
					return true
				}
			}
		},

		mouseRelease(button, x, y) {
			
		},

		mouseScroll(dy) {
			if (Math.abs(dy) >= 1) {
				// Rotate furniture that is being placed
				if (this.furniture) {
					this.rotateFurniture(Math.max(-1,Math.min(1,dy)))
				}
			}
		},

		getFurniturePlaceable(itemId) {
			let obj = this.furnitureObj
			let item = getItemData(itemId)

			// Can the item be placed at this location?
			if (item.walls) { // only walls
				// Wall items must be colliding with one wall and no furniture
				if (obj.wallsColliding === 1 && obj.furnitureColliding === 0 && obj.y < 200) {
					return true
				}
				return false
			} else if (item.rug) { // only floor
				// Rugs can't collide with other rugs or walls
				if (obj.colliding === obj.furnitureColliding && !(obj.rugsColliding > 0)) {
					return true
				}
				return false
			} else if (item.tabletops) { // tabletops allowed
				// Collisions are free game so long as its colliding with a table
				if (!(obj.colliding-obj.rugsColliding === 0 || (obj.colliding-obj.rugsColliding === 1 && obj.tablesColliding === 1))) {
					return false
				}
			} else {
				// Other furniture cannot collide with anything, except rugs
				if (obj.colliding > 0 && !(obj.colliding === obj.rugsColliding)) {
					return false
				}
			}
			return true
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
			let item = getItemData(itemId)

			if (!this.getFurniturePlaceable(itemId)) {
				return true
			}
	
			this.furniture = false
			this.furnitureItem = false
	
			// Let go of furniture object
			this.furnitureX = Math.floor(this.furnitureX)
			this.furnitureY = Math.floor(this.furnitureY)
			this.furnitureObj.setPosition(this.furnitureX, this.furnitureY)
			this.furnitureObj.static = true
	
			placeFurniture(itemId, this.furnitureX, this.furnitureY, this.furnitureDir)
			removeItem(itemId, "furniture") // Furniture has been placed, remove from inventory

			// Update stacking of furniture
			for (const [id, obj] of Object.entries(OBJECTS["Furniture"])) {
				obj.updateStacking()
			}
		},

		removeFurniture(x, y) {
			// Look for furniture at point (x, y)
			for (const [id, obj] of Object.entries(OBJECTS["Furniture"])) {
				let [objx, objy] = [obj.x, obj.y-obj.tabletopOffset]
				if (obj.shape.checkInside(x-objx, y-objy)) {
					removeFurniture(obj.id, objx, objy)
					addItem(obj.id) // Add back to inventory

					// Remove furniture
					obj.destroy()
					// Update stacking of furniture
					for (const [id, obj] of Object.entries(OBJECTS["Furniture"])) {
						obj.updateStacking()
					}
					return true
				}
			}
			return false
		},

		rotateFurniture(amount=1) {
			let furnitureDirs = ["down", "left", "up", "right"]
			// Rotate furniture clockwise
			// find index of current dir, then get next dir
			let dirIndex = furnitureDirs.indexOf(this.furnitureDir)
			let nextDirIndex = (dirIndex+amount) % furnitureDirs.length
			this.furnitureDir = furnitureDirs[nextDirIndex]
			this.furnitureObj.setDir(this.furnitureDir)
		}
	};
	
 return functions; })()