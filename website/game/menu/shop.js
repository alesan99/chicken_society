//Customize Player Menu; Menu with options to modify player profile and customize chicken

MENUS["shop"] = new class extends Menu {
	//Initialize
	constructor () {
		super(234,104, 560,350)
	}

    load (config) {
		this.openTimer = 0

		this.buttons = {}
		this.buttons["close"] = new Button("X", ()=>{closeMenu()}, null, 740,128, 32,32)

		this.name = config.name || ""
		this.items = config.items || {} // {category: {itemId: price}}
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
		this.filterInventory("all")
		this.buttons["allTab"].selected = true

		this.selectedItem = false
		this.selectedItemType = false
		this.selectedItemDescription = []

		this.buttons["inventory"] = new ItemGrid(
			(itemId,itemType)=>{
				// Item to preview
				if (itemId) {
					this.selectedItem = itemId
					this.selectedItemType = itemType
					if (ITEMS[itemType][itemId].description) {
						this.selectedItemDescription = DRAW.wrapText(ITEMS[itemType][itemId].description, 110)
					} else {
						this.selectedItemDescription = false
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
				this.buyItem(this.selectedItemType, this.selectedItem)
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
	buyItem(itemType, itemId) {
		let item = ITEMS[itemType][itemId]
		if (spendNuggets(item.cost)) {
			addItem(itemType, itemId)
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
			DRAW.text(item.name, 553, 210, "left")

			if (SAVEDATA.items[this.selectedItemType][this.selectedItem]) {
				DRAW.text(`Owned: ${SAVEDATA.items[this.selectedItemType][this.selectedItem]}`, 764, 360, "right")
			}

			DRAW.text(`${item.cost} Nuggets`, 764, 388, "right")

			DRAW.setColor(152, 80, 46, scale)
			DRAW.setFont(FONT.description)
			if (this.selectedItemDescription) {
				for (let i = 0; i < this.selectedItemDescription.length; i++) {
					DRAW.text(this.selectedItemDescription[i], 553, 242 + i * 20, "left")
				}
			}
		} else {
			DRAW.text("Select an item.", 553, 210, "left")
		}

		// Render all buttons
		this.drawButtons()
	}

	update(dt) {
		this.openTimer = Math.min(1, this.openTimer + 4*dt)

		this.updateButtons(dt)
	}
}()