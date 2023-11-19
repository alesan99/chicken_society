//Customize Player Menu; Menu with options to modify player profile and customize chicken

MENUS["shop"] = new class extends Menu {
	//Initialize
	constructor () {
		super(234,104, 560,350)
	}

    load (config) {
		this.openTimer = 0

		this.buttons = {}
		this.buttons[0] = new Button("Confirm", ()=>{closeMenu()}, null, 665,399, 100,32)

		this.name = config.name || ""
		this.items = config.items || []
        // Shop items
		let i = 0
		for (const [category, list] of Object.entries(this.items)) {
			for (const [itemId, setPrice] of Object.entries(list)) {
				let itemType = category
				let item = getItemData(itemId, category)

				let itemName = item.name
				let price = setPrice
				if (price == true) { // If not price is set by shop, use default
					price = item.cost
				}

				let itemButton = new Button(itemName, ()=>{this.buyItem(itemType, itemId, i)}, null, 270,180+(31*i), 300,30)
				// let buyButton = new Button(price, ()=>{this.buyItem(itemType, itemId)}, null, 510,160+(32*i), 70,30)
				this.buttons[`${i}-item`] = itemButton
				// this.buttons[`${i}-buy`] = buyButton

				i += 1
			}
		}
    }

	// TODO: maybe this should be in a different file so items can also be earned in other ways?
	buyItem(itemType, itemId, i) {
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

		// Prices
        DRAW.text("Price", 640, 170, "center")
        DRAW.text("Owned", 720, 170, "center")
		// for (let i = 0; i < this.items.length; i++) {
		// 	let itemId = this.items[i][1]
		// 	let itemType = this.items[i][0]
		// 	let item = getItemData(itemId, itemType)
		// 	let itemName = item.name
		// 	let price = item.cost
		// 	DRAW.text(price, 640, 200+(31*i), "center")
		// 	// How many you own
		// 	DRAW.text(SAVEDATA.items[itemType][itemId], 720, 200+(31*i), "center")
		// }

		// Render all buttons
		this.drawButtons()
	}

	update(dt) {
		this.openTimer = Math.min(1, this.openTimer + 4*dt)

		this.updateButtons(dt)
	}
}()