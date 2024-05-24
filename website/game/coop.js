// TODO: Visit other player's coops
// TODO: Wallpapers

import {DRAW, SAVEDATA, PROFILE, WORLD, NETPLAY, CURSOR} from "./main.js"
import {IMG, SPRITE, ANIM, FONT, SFX, ITEMS} from "./assets.js"
import {HEXtoRGB, RGBtoHEX, removeNuggets, addNuggets, spendNuggets, addItem, removeItem, getItemCategory, getItemData, getItem, placeFurniture, removeFurniture} from "./savedata.js"
import {openMenu, closeMenu, getOpenMenu} from "./state.js"
import {OBJECTS, PLAYER, PLAYER_CONTROLLER, PHYSICSWORLD} from "./world.js"
import QuestSystem from "./quests.js"
import Transition from "./transition.js"
import AudioSystem from "./engine/audio.js"
import {checkCondition} from "./area.js"
import {Button, TextField, ColorSlider, ScrollBar} from "./gui/gui.js"
import { canvasWidth, canvasHeight } from "./engine/render.js"
import {Furniture} from "./objects/objects.js"
import { getMousePos } from "./engine/input.js"

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

			this.initialCollisionCheck = false
		},

		load(coopFurniture, owner) {
			this.owner = owner

			this.initialCollisionCheck = 2 // Do two update cycles before enabling static furniture

			// Create objects for all saved furniture
			for (let i = 0; i < coopFurniture.length; i++) {
				let data = coopFurniture[i]
				let itemId = data.id

				let obj = new Furniture(PHYSICSWORLD, itemId, data.x, data.y, data.dir)
				obj.static = false // Temporary, for initial collision check

				WORLD.spawnObject("Furniture", obj)
			}
		},

		update(dt) {
			// Initial collision check
			if (this.initialCollisionCheck) {
				this.initialCollisionCheck -= 1
				if (this.initialCollisionCheck == 0) {
					// Update stacking of furniture
					for (const [id, obj] of Object.entries(OBJECTS["Furniture"])) {
						obj.static = true
						obj.updateStacking()
					}
					this.initialCollisionCheck = false
				}
			}

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
				DRAW.text("Rotate Furniture with Scroll Wheel or E key", 10, 30)
				DRAW.text("Place Furniture with Left Click", 10, 50)
				DRAW.text("Remove Furniture with Right Click", 10, 70)
			}
		},

		keyPress(key) {
			if (this.owner != NETPLAY.id) {
				// Can't edit coop if you're not the owner
				return false
			}
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
			if (this.owner != NETPLAY.id) {
				// Can't edit coop if you're not the owner
				return false
			}
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
			if (this.owner != NETPLAY.id) {
				// Can't edit coop if you're not the owner
				return false
			}
		},

		mouseScroll(dy) {
			if (this.owner != NETPLAY.id) {
				// Can't edit coop if you're not the owner
				return false
			}
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
			if (this.owner != NETPLAY.id) {
				// Can't edit coop if you're not the owner
				return false
			}
			
			// Start placing furniture
			this.furniture = true
			this.furnitureItem = itemId
	
			this.furnitureDir = "down"
	
			// Create furniture item physics object
			this.furnitureObj = WORLD.spawnObject("Furniture", new Furniture(PHYSICSWORLD, itemId, 0, 0, this.furnitureDir))
			this.furnitureObj.static = false
			this.furnitureObj.moving = true
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
			this.furnitureObj.moving = false
	
			placeFurniture(itemId, this.furnitureX, this.furnitureY, this.furnitureDir)
			removeItem(itemId, "furniture") // Furniture has been placed, remove from inventory

			// Update stacking of furniture
			for (const [id, obj] of Object.entries(OBJECTS["Furniture"])) {
				obj.updateStacking()
			}

			// TEMPORARY
			// This should use a more sophisticated system designed around the database once its finished
			NETPLAY.sendCoopData()
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
		},

		// Set theme of coop; the background
		setTheme(theme) {
			if (this.owner != NETPLAY.id) {
				// Can't edit coop if you're not the owner
				return false
			}
			// Set theme
			SAVEDATA.coop.theme = theme
			NETPLAY.sendCoopData()
			// Refresh (lazy)
			WORLD.warpToArea("coop", null, null, this.owner, SAVEDATA.coop);
		}
	};
	
 return functions; })()

 export default Coop;