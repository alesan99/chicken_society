//Customize Player Menu; Menu with options to modify player profile and customize chicken

MENUS["customization"] = new class extends Menu {
	//Initialize
	constructor () {
		super(234,104, 560,350)
	}

	load () {
		this.openTimer = 0

		this.buttons = {}
		this.buttons["close"] = new Button("X", ()=>{closeMenu()}, null, 740,128, 32,32)

		// Profile loading from local browser storage (NOT from server)
		this.buttons["load"] = new Button("Load", ()=>{
			let data = loadSaveData();
			if (data) {
				SAVEDATA = data;
				PROFILE = SAVEDATA.profile;
				PLAYER.updateProfile(PROFILE, "sendToServer");
			}
		}, null, 263,404, 100,32)
		this.buttons["save"] = new Button("Save", ()=>{
			saveSaveData(SAVEDATA);
			PROFILE = SAVEDATA.profile;
		}, null, 373,404, 100,32)

		// Name
		this.buttons["name"] = new Button(PROFILE.name, ()=>{}, null, 292,129, 140,32)

		// Color
		this.buttons["color"] = new Button("Random", ()=>{
			PROFILE.color = RGBtoHEX(Math.floor(100 + Math.random()*155),
				Math.floor(100 + Math.random()*155),
				Math.floor(100 + Math.random()*155));
			PLAYER.updateProfile(PROFILE, "sendToServer");
		}, null, 348,365, 100,32)

		// Inventory
		this.tab = "allTab"
		this.inventory = []
		this.buttons["allTab"] = new Button("All", ()=>{this.filterInventory("all"); this.buttons[this.tab].selected=false; this.tab = "allTab"; this.buttons[this.tab].selected=true}, null, 476,150, 46,34)
		this.buttons["headTab"] = new Button("H", ()=>{this.filterInventory("head"); this.buttons[this.tab].selected=false; this.tab = "headTab"; this.buttons[this.tab].selected=true}, {icon:IMG.items, iconFrame:SPRITE.items.getFrame(0)}, 522,150, 34,34)
		this.buttons["faceTab"] = new Button("F", ()=>{this.filterInventory("face"); this.buttons[this.tab].selected=false; this.tab = "faceTab"; this.buttons[this.tab].selected=true}, {icon:IMG.items, iconFrame:SPRITE.items.getFrame(1)}, 522+34*1,150, 34,34)
		this.buttons["bodyTab"] = new Button("B", ()=>{this.filterInventory("body"); this.buttons[this.tab].selected=false; this.tab = "bodyTab"; this.buttons[this.tab].selected=true}, {icon:IMG.items, iconFrame:SPRITE.items.getFrame(2)}, 522+34*2,150, 34,34)
		this.buttons["furnitureTab"] = new Button("FT", ()=>{this.filterInventory("furniture"); this.buttons[this.tab].selected=false; this.tab = "furnitureTab"; this.buttons[this.tab].selected=true}, {icon:IMG.items, iconFrame:SPRITE.items.getFrame(3)}, 522+34*3,150, 34,34)
		this.buttons["itemTab"] = new Button("I", ()=>{this.filterInventory("item"); this.buttons[this.tab].selected=false; this.tab = "itemTab"; this.buttons[this.tab].selected=true}, {icon:IMG.items, iconFrame:SPRITE.items.getFrame(4)}, 522+34*4,150, 34,34)
		this.buttons["petTab"] = new Button("P", ()=>{this.filterInventory("pet"); this.buttons[this.tab].selected=false; this.tab = "petTab"; this.buttons[this.tab].selected=true}, {icon:IMG.items, iconFrame:SPRITE.items.getFrame(5)}, 522+34*5,150, 34,34)
		this.filter = "all"
		this.filterInventory("all")
		this.buttons["allTab"].selected = true

		this.buttons["inventory"] = new ItemGrid(
			(itemId,itemType)=>{
				// Set clothing item
				if (PROFILE.hasOwnProperty(itemType)) {
					let equipped = false
					if (PROFILE[itemType] == itemId) {
						PROFILE[itemType] = false;
					} else {
						equipped = true
						PROFILE[itemType] = itemId;
					}
					PLAYER.updateProfile(PROFILE, "sendToServer");
					let item = ITEMS[itemType][itemId]
					if (item && equipped) { // Make sure item has been loaded
						if (itemType == "item" && item.consumable) { // TODO: Figure out a better place for this
							removeItem(itemType, itemId)
							if (item.statusEffect) {
								PLAYER.startStatusEffect(item.statusEffect, item.statusEffectDuration)
							}
							this.filterInventory(this.filter) // Refresh item list
						}
					}
				} else {
					let item = ITEMS[itemType][itemId]

					if (item) {
						if (itemType == "furniture" && PLAYER.area == "coop") { // TODO: Also figure out a better place for this
							Coop.moveFurniture(itemId, closeMenu())
						}
					}
				}
			},
			this.inventory, 
			(itemId,itemType)=>{
				// Is selected?
				if (PROFILE[itemType] && PROFILE[itemType] == itemId) {
					return true
				}
			}, 476,184, 56,56, 5,3)
		this.buttons["inventory"].showCount = true // How how many of each item the player owns

		// this.buttons["bodyRight"] = new Button(">", ()=>{
		// 	let keys = Object.keys(SAVEDATA.items.body);
		// 	if (keys.length == 0) {
		// 		PROFILE.body = false
		// 	} else {
		// 		PROFILE.body = keys[Math.floor(Math.random() * keys.length)];
		// 	}
		// 	PLAYER.updateProfile(PROFILE, "sendToServer");
		// }, null, 733,322, 32,32)
		// Pet
		this.buttons["pet"] = new Button("None", ()=>{}, null, 665,362, 100,32)
	}

	filterInventory(category) {
		this.filter = category
		this.inventory.length = 0
		if (category == "all") {
			for (let category in SAVEDATA.items) {
				for (let itemId in SAVEDATA.items[category]) {
					this.inventory.push(itemId)
				}
			}
		} else {
			for (let itemId in SAVEDATA.items[category]) {
				this.inventory.push(itemId)
			}
		}
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
		DRAW.text("Inventory", 620, 142, "center")

		DRAW.text("Color", 285, 388, "left")

		DRAW.text("Pet", 613, 384, "left")

		PLAYER.draw(360,340,"down")

		// Render all buttons
		this.drawButtons()
	}

	update(dt) {
		this.openTimer = Math.min(1, this.openTimer + 4*dt)

		this.updateButtons(dt)
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
}()