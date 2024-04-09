//Customize Player Menu; Menu with options to modify player profile and customize chicken

MENUS["shop"] = new class extends Menu {
	//Initialize
	constructor () {
		super(234,104, 560,350)
	}

	load (config) {
		this.openTimer = 0

		this.buttons = {}
		this.buttons["close"] = new Button("✖", ()=>{closeMenu()}, null, 740,128, 32,32)

		this.name = config.name || ""
		this.items = config.items || {} // {category: {itemId: true or {"items":{"priceItem":1},"nuggets":0}}}
		// Shop items
		// Inventory
		this.tab = "allTab"
		this.inventory = []
		this.buttons["allTab"] = new Button("All", ()=>{this.filterInventory("all"); this.buttons[this.tab].selected=false; this.tab = "allTab"; this.buttons[this.tab].selected=true}, null, 265,150, 46,34)
		let i = 0
		if (this.items["head"]) { // Only enable tab if selling items in this category
			this.buttons["headTab"] = new Button("H", ()=>{this.filterInventory("head"); this.buttons[this.tab].selected=false; this.tab = "headTab"; this.buttons[this.tab].selected=true}, {icon:IMG.items, iconFrame:SPRITE.items.getFrame(0)}, 311+34*i,150, 34,34)
			i++
		}
		if (this.items["face"]) { // Only enable tab if selling items in this category
			this.buttons["faceTab"] = new Button("F", ()=>{this.filterInventory("face"); this.buttons[this.tab].selected=false; this.tab = "faceTab"; this.buttons[this.tab].selected=true}, {icon:IMG.items, iconFrame:SPRITE.items.getFrame(1)}, 311+34*i,150, 34,34)
			i++
		}
		if (this.items["body"]) { // Only enable tab if selling items in this category
			this.buttons["bodyTab"] = new Button("B", ()=>{this.filterInventory("body"); this.buttons[this.tab].selected=false; this.tab = "bodyTab"; this.buttons[this.tab].selected=true}, {icon:IMG.items, iconFrame:SPRITE.items.getFrame(2)}, 311+34*i,150, 34,34)
			i++
		}
		if (this.items["furniture"]) { // Only enable tab if selling items in this category
			this.buttons["furnitureTab"] = new Button("FT", ()=>{this.filterInventory("furniture"); this.buttons[this.tab].selected=false; this.tab = "furnitureTab"; this.buttons[this.tab].selected=true}, {icon:IMG.items, iconFrame:SPRITE.items.getFrame(3)}, 311+34*i,150, 34,34)
			i++
		}
		if (this.items["item"]) { // Only enable tab if selling items in this category
			this.buttons["itemTab"] = new Button("I", ()=>{this.filterInventory("item"); this.buttons[this.tab].selected=false; this.tab = "itemTab"; this.buttons[this.tab].selected=true}, {icon:IMG.items, iconFrame:SPRITE.items.getFrame(4)}, 311+34*i,150, 34,34)
			i++
		}
		if (this.items["pet"]) { // Only enable tab if selling items in this category
			this.buttons["petTab"] = new Button("I", ()=>{this.filterInventory("pet"); this.buttons[this.tab].selected=false; this.tab = "petTab"; this.buttons[this.tab].selected=true}, {icon:IMG.items, iconFrame:SPRITE.items.getFrame(5)}, 311+34*i,150, 34,34)
			i++
		}
		this.filterInventory("all")
		this.buttons["allTab"].selected = true

		this.selectedItem = false
		this.selectedItemType = false
		this.selectedItemDescription = []

		this.buttons["inventory"] = new ItemGrid(
			(itemId,itemType)=>{
				// Item to preview
				if (itemId) {
					this.selectedItemCost = this.items[itemType][itemId]
					this.selectedItem = itemId
					this.selectedItemType = itemType
					if (ITEMS[itemType][itemId]) { // Make sure item has been loaded
						if (ITEMS[itemType][itemId].description) {
							DRAW.setFont(FONT.description)
							this.selectedItemDescription = DRAW.wrapText(ITEMS[itemType][itemId].description, 200)
						} else {
							this.selectedItemDescription = false
						}
					}
				}
			},
			this.inventory, 
			(itemId,itemType,over)=>{
				// Is selected?
				if (this.selectedItem == itemId) {
					return true
				} else if (SAVEDATA.items[itemType][itemId]) {
					return "gray"
				}
			}, 265,184, 68,68, 4,3)

		this.buttons["buy"] = new Button("Buy", ()=>{
			if (this.selectedItem) {
				let cost = false
				// check if item is set to array of costs
				if (this.selectedItemCost && typeof this.selectedItemCost == "object") {
					cost = this.selectedItemCost
				}
				this.buyItem(this.selectedItemType, this.selectedItem, cost)
			}
		}, null, 664,400, 100,30)
	}

	filterInventory(category) {
		this.inventory.length = 0
		if (category == "all") {
			for (let category in this.items) {
				for (let itemId in this.items[category]) {
					this.inventory.push(itemId)
				}
			}
		} else {
			for (let itemId in this.items[category]) {
				this.inventory.push(itemId)
			}
		}
	}

	// TODO: maybe this should be in a different file so items can also be earned in other ways?
	buyItem(itemType, itemId, cost=false) {
		let item = ITEMS[itemType][itemId]
		if (item) { // Make sure item has been loaded
			if (!cost) {
				// Use default cost
				if (spendNuggets(item.cost)) {
					addItem(itemType, itemId)
				}
			} else if (typeof cost == "number") {
				// Use shop's nugget cost
				if (spendNuggets(cost)) {
					addItem(itemType, itemId)
				}
			} else {
				// Use shop's cost
				let itemsCost = cost.items
				let nuggetsCost = cost.nuggets || 0
				let canBuy = false

				if (itemsCost) {
					// Check if you have items neccessary
					let canBuyItems = true
					for (let itemId in itemsCost) {
						let itemsOwned = getItem(itemId)
						if (itemsOwned < itemsCost[itemId]) {
							canBuyItems = false
							break
						}
					}
					if (canBuyItems) {
						canBuy = true
					}
				}

				if (nuggetsCost) {
					// Check if you have enough nuggets
					if (SAVEDATA.nuggets >= nuggetsCost) {
						canBuy = true
					}
				}

				if (canBuy) {
					if (nuggetsCost) {
						spendNuggets(nuggetsCost)
					}
					if (itemsCost) {
						for (let itemId in itemsCost) {
							removeItem(null, itemId, itemsCost[itemId])
						}
					}
					addItem(itemType, itemId)
				}
			}
		}
	}

	keyPress(key) {

	}

	keyRelease(key) {
		
	}

	mouseClick(button, x, y) {
		return super.mouseClick(button, x, y)
	}

	mouseRelease(button, x, y) {
		return super.mouseRelease(button, x, y)
	}

	mouseScroll(dy) {
		return super.mouseScroll(dy)
	}
	
	draw() {
		// Window
		let scale = 1
		if (this.openTimer < 1) {
			scale = easing("easeOutBack", this.openTimer)
		}
		DRAW.image(IMG.menu, null, this.x+this.w*0.5, this.y+this.h*0.5, 0, scale, scale, 0.5, 0.5)

		// Text
		DRAW.setColor(112, 50, 16, scale)
		DRAW.setFont(FONT.caption)
		DRAW.text(this.name, 520, 142, "center")

		// Item information
		if (this.selectedItem) {
			let item = ITEMS[this.selectedItemType][this.selectedItem]
			if (item) { // Make sure item has been loaded
				// Name
				DRAW.text(item.name, 563, 210, "left")
	
				let nuggetsCost = item.cost // Default item cost
				let itemCost = false
				if (this.selectedItemCost) {
					if (typeof this.selectedItemCost == "object") {
						// Define items (and nuggets, if desired)
						nuggetsCost = false
						itemCost = this.selectedItemCost.items
						if (this.selectedItemCost.nuggets) {
							nuggetsCost = this.selectedItemCost.nuggets
						}
					} else if (typeof this.selectedItemCost == "number") {
						// Define nuggets
						nuggetsCost = this.selectedItemCost
					}
				}

				let costY = 388
				if (nuggetsCost) { // Display nuggets cost
					DRAW.text(`${item.cost} Nuggets`, 764, costY, "right")
					costY -= 25
				}
				// Display items cost
				if (itemCost) {
					for (let itemId in itemCost) {
						let item = getItemData(itemId)
						if (item) {
							DRAW.text(`${itemCost[itemId]} ${item.name}(s)`, 764, costY, "right")
							costY -= 25
						}
					}
				}

				// Display how many of this item you own
				if (SAVEDATA.items[this.selectedItemType][this.selectedItem]) {
					DRAW.text(`Owned: ${SAVEDATA.items[this.selectedItemType][this.selectedItem]}`, 764, costY, "right")
				}
	
				// Description
				DRAW.setColor(152, 80, 46, scale)
				DRAW.setFont(FONT.description)
				if (this.selectedItemDescription) {
					for (let i = 0; i < this.selectedItemDescription.length; i++) {
						DRAW.text(this.selectedItemDescription[i], 563, 242 + i * 20, "left")
					}
				}
			}
		} else {
			DRAW.text("Select an item.", 563, 210, "left")
		}

		// Render all buttons
		this.drawButtons()
	}

	update(dt) {
		this.openTimer = Math.min(1, this.openTimer + 4*dt)

		this.updateButtons(dt)
	}
}()