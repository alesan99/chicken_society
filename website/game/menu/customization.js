//Customize Player Menu; Menu with options to modify player profile and customize chicken

MENUS["customization"] = new class extends Menu {
	//Initialize
	constructor () {
		super(234,104, 560,350)
	}

	load () {
		this.openTimer = 0

		this.buttons = {}
		this.buttons["close"] = new Button("✖", ()=>{closeMenu()}, null, 740,128, 32,32)

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
		this.buttons["name"] = new TextField(PROFILE.name, (text)=>{PROFILE.name = text; PLAYER.updateProfile(PROFILE, "sendToServer")}, null, 260,129, 200,32)

		// Color
		this.colorSel = HEXtoRGB(PROFILE.color)
		let hsv = this.RGBtoHSV(this.colorSel[0], this.colorSel[1], this.colorSel[2])
		this.hue = hsv[0]
		this.sat = hsv[1]
		this.val = hsv[2]
		this.hueColorSel = this.HSVtoRGB(this.hue, 1.0, 1.0)
		this.buttons["colorHue"] = new ColorSlider(328,360, 140,12, this.hue, 0, 1,
			(value)=>{ return this.HSVtoRGB(value, 1.0, 1.0) }, // get color at value
			(value)=>{ // Change value
				this.hue = value
				this.colorSel = this.HSVtoRGB(this.hue, this.sat, this.val)
				this.hueColorSel = this.HSVtoRGB(this.hue, 1.0, 1.0)
				PROFILE.color = RGBtoHEX(this.colorSel[0], this.colorSel[1], this.colorSel[2]);
				PLAYER.updateProfile(PROFILE);
			},
			(value)=>{ PLAYER.updateProfile(PROFILE, "sendToServer"); } // Finish changing value
		)
		this.buttons["colorHue"].renderColors = false
		this.buttons["colorSat"] = new ColorSlider(328,360+12, 140,12, this.sat, 0, 0.9,
			(value)=>{ return this.HSVtoRGB(hue, value, val) }, // get color at value
			(value)=>{ // Change value
				this.sat = value
				this.colorSel = this.HSVtoRGB(this.hue, this.sat, this.val)
				PROFILE.color = RGBtoHEX(this.colorSel[0], this.colorSel[1], this.colorSel[2]);
				PLAYER.updateProfile(PROFILE);
			},
			(value)=>{ PLAYER.updateProfile(PROFILE, "sendToServer"); } // Finish changing value
		)
		this.buttons["colorSat"].renderColors = false
		this.buttons["colorVal"] = new ColorSlider(328,360+12+12, 140,12, this.val, 0.2, 1,
			(value)=>{ return this.HSVtoRGB(hue, sat, value) }, // get color at value
			(value)=>{ // Change value
				this.val = value
				this.colorSel = this.HSVtoRGB(this.hue, this.sat, this.val)
				PROFILE.color = RGBtoHEX(this.colorSel[0], this.colorSel[1], this.colorSel[2]);
				PLAYER.updateProfile(PROFILE);
			},
			(value)=>{ PLAYER.updateProfile(PROFILE, "sendToServer"); } // Finish changing value
		)
		this.buttons["colorVal"].renderColors = false

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

		this.selectedItem = false
		this.selectedItemType = false
		this.selectedItemDescription = false
		this.buttons["inventory"] = new ItemGrid(
			(itemId,itemType)=>{
				// Select item (to display information below inventory)
				this.selectedItem = itemId
				this.selectedItemType = itemType
				let item = ITEMS[itemType][itemId]
				if (item) { // Make sure item has been loaded
					if (item.description) {
						DRAW.setFont(FONT.description)
						this.selectedItemDescription = DRAW.wrapText(item.description, 300)
					}
				}
				if (useItem(itemId, itemType)) { // Set clothing item or use consumable
					this.filterInventory(this.filter) // Refresh item list
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

		// Do initial filter
		this.filter = "all"
		this.filterInventory("all")
		this.buttons["allTab"].selected = true

		//this.buttons["pet"] = new Button("None", ()=>{}, null, 665,362, 100,32)
	}

	filterInventory(category) {
		this.filter = category
		this.selectedItem = false
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
		this.buttons["inventory"].updateList(this.inventory)
	}
	
	draw() {
		// Window
		let scale = 1
		if (this.openTimer < 1) {
			scale = easing("easeOutBack", this.openTimer)
		}
		DRAW.image(IMG.menu, null, this.x+this.w*0.5, this.y+this.h*0.5, 0, scale, scale, 0.5, 0.5)

		// Inventory
		DRAW.setColor(112, 50, 16, scale)
		DRAW.setFont(FONT.caption)
		DRAW.text("Inventory", 620, 142, "center")
		// Item information
		if (this.selectedItem) {
			let item = ITEMS[this.selectedItemType][this.selectedItem]
			if (item) { // Make sure item has been loaded
				// Name
				DRAW.text(item.name, 484, 378, "left")
				// Description
				DRAW.setColor(152, 80, 46, scale)
				DRAW.setFont(FONT.description)
				if (this.selectedItemDescription) {
					for (let i = 0; i < this.selectedItemDescription.length; i++) {
						DRAW.text(this.selectedItemDescription[i], 484, 400 + i * 20, "left")
					}
				}
			}
		}

		// Text
		DRAW.setColor(112, 50, 16, scale)
		DRAW.setFont(FONT.caption)
		DRAW.text("Color:", 265, 385, "left")

		PLAYER.draw(360,340,"down")

		// Color sliders
		let slider = this.buttons["colorHue"]
		DRAW.setColor(168, 85, 38, 1)
		DRAW.setLineWidth(2)
		DRAW.rectangle(slider.x-1, slider.y-1, slider.w+2, slider.h*3+2, "line");
		slider = this.buttons["colorHue"]
		DRAW.setColor(255,255,255,1.0)
		DRAW.image(IMG.colorSlider, SPRITE.colorSlider.getFrame(0,0), slider.x, slider.y)
		DRAW.setColor(255,255,255,1.0)
		DRAW.image(IMG.colorSlider, SPRITE.colorSlider.getFrame(0,3), slider.x, slider.y)
		slider = this.buttons["colorSat"]
		DRAW.setColor(this.hueColorSel[0], this.hueColorSel[1], this.hueColorSel[2],1.0)
		DRAW.rectangle(slider.x, slider.y, slider.w, slider.h, "fill")
		DRAW.setColor(255,255,255,1.0)
		DRAW.image(IMG.colorSlider, SPRITE.colorSlider.getFrame(0,1), slider.x, slider.y)
		DRAW.setColor(0,0,0,1.0-this.val)
		DRAW.rectangle(slider.x, slider.y, slider.w, slider.h, "fill")
		DRAW.setColor(255,255,255,1.0)
		DRAW.image(IMG.colorSlider, SPRITE.colorSlider.getFrame(0,3), slider.x, slider.y)
		slider = this.buttons["colorVal"]
		DRAW.setColor(this.hueColorSel[0], this.hueColorSel[1], this.hueColorSel[2],1.0)
		DRAW.rectangle(slider.x, slider.y, slider.w, slider.h, "fill")
		DRAW.setColor(255,255,255,1.0-this.sat)
		DRAW.rectangle(slider.x, slider.y, slider.w, slider.h, "fill")
		DRAW.setColor(255,255,255,1.0)
		DRAW.image(IMG.colorSlider, SPRITE.colorSlider.getFrame(0,2), slider.x, slider.y)
		DRAW.setColor(255,255,255,1.0)
		DRAW.image(IMG.colorSlider, SPRITE.colorSlider.getFrame(0,3), slider.x, slider.y)

		// Render all buttons
		this.drawButtons()
	}

	update(dt) {
		this.openTimer = Math.min(1, this.openTimer + 4*dt)

		this.updateButtons(dt)
	}

	mouseClick(button, x, y) {
		super.mouseClick(button, x, y)
		if (!MENUS["chatMenu"].checkMouseInside()) {
			// Disable clicking anywhere else, except for chat hud
			return true
		}
	}

	mouseRelease(button, x, y) {
		return super.mouseRelease(button, x, y)
	}
	
	RGBtoHSV(r, g, b) {
		// r, g, b are 0-255
		// h, s, v are 0-1
		r /= 255;
		g /= 255;
		b /= 255;

		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const d = max - min;

		let h;
		if (d === 0) {
			h = 0;
		} else if (max === r) {
			h = ((g - b) / d) % 6;
		} else if (max === g) {
			h = (b - r) / d + 2;
		} else {
			h = (r - g) / d + 4;
		}
		h /= 6;
		if (h < 0) {
			h += 1;
		}

		let s;
		if (max === 0) {
			s = 0;
		} else {
			s = d / max;
		}

		const v = max;
	
		return [h, s, v];
	}
	
	HSVtoRGB(h, s, v) {
		// h, s, v are 0-1
		// r, g, b are 0-255
		const c = v * s;
		const x = c * (1 - Math.abs((h * 6) % 2 - 1));
		const m = v - c;
	
		let r1, g1, b1;
		if (h < 1/6) {
			r1 = c;
			g1 = x;
			b1 = 0;
		} else if (h < 2/6) {
			r1 = x;
			g1 = c;
			b1 = 0;
		} else if (h < 3/6) {
			r1 = 0;
			g1 = c;
			b1 = x;
		} else if (h < 4/6) {
			r1 = 0;
			g1 = x;
			b1 = c;
		} else if (h < 5/6) {
			r1 = x;
			g1 = 0;
			b1 = c;
		} else {
			r1 = c;
			g1 = 0;
			b1 = x;
		}
	
		const r = Math.round((r1 + m) * 255);
		const g = Math.round((g1 + m) * 255);
		const b = Math.round((b1 + m) * 255);
	
		return [r, g, b];
	}	
}()