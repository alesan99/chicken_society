//Customize Player Menu; Menu with options to modify player profile and customize chicken

MENUS["customization"] = new class extends Menu {
	//Initialize
	constructor () {
		super(234,104, 560,350)
	}

    load () {
		this.buttons = {}
		this.buttons["confirm"] = new Button("Confirm", ()=>{closeMenu()}, null, 665,399, 100,32)

		// Profile loading from local browser storage (NOT from server)
		this.buttons["load"] = new Button("Load", ()=>{
			let data = loadSaveData();
			if (data) {
				SAVEDATA = data;
				PROFILE = SAVEDATA.profile;
				PLAYER.updateProfile(PROFILE, "sendToServer");
			}
		}, null, 445,399, 100,32)
		this.buttons["save"] = new Button("Save", ()=>{
			saveSaveData(SAVEDATA);
			PROFILE = SAVEDATA.profile;
		}, null, 555,399, 100,32)

        // Name
		this.buttons["name"] = new Button(PROFILE.name, ()=>{}, null, 665,162, 100,32)
        // Color
		this.buttons["color"] = new Button("Random", ()=>{
            PROFILE.color = [Math.floor(100 + Math.random()*155),
                Math.floor(100 + Math.random()*155),
                Math.floor(100 + Math.random()*155)];
            PLAYER.updateProfile(PROFILE, "sendToServer");
        }, null, 665,202, 100,32)
        // Hat
		this.buttons["hatLeft"] = new Button("<", ()=>{
            PROFILE.hat = SAVEDATA.hats[Math.floor(Math.random()*SAVEDATA.hats.length)];
            PLAYER.updateProfile(PROFILE, "sendToServer");
        }, null, 605,242, 32,32)
		this.buttons["hatRight"] = new Button(">", ()=>{
            PROFILE.hat = SAVEDATA.hats[Math.floor(Math.random()*SAVEDATA.hats.length)];
            PLAYER.updateProfile(PROFILE, "sendToServer");
        }, null, 733,242, 32,32)
        // Accessory
		this.buttons["accessoryLeft"] = new Button("<", ()=>{
            PROFILE.accessory = SAVEDATA.accessories[Math.floor(Math.random()*SAVEDATA.accessories.length)];
			PLAYER.updateProfile(PROFILE, "sendToServer");
        }, null, 605,282, 32,32)
		this.buttons["accessoryRight"] = new Button(">", ()=>{
            PROFILE.accessory = SAVEDATA.accessories[Math.floor(Math.random()*SAVEDATA.accessories.length)];
			PLAYER.updateProfile(PROFILE, "sendToServer");
        }, null, 733,282, 32,32)
        // Pet
		this.buttons["pet"] = new Button("None", ()=>{}, null, 665,322, 100,32)
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
        DRAW.image(IMG.menu, null, this.x, this.y)

        // Text
        DRAW.setColor(112, 50, 16, 1.0)
        DRAW.setFont(FONT.caption)
        DRAW.text("Chicken Profile", 512, 142, "center")

        DRAW.text("Display Name", 460, 184, "left")
        DRAW.text("Color", 460, 224, "left")
        DRAW.text("Hat", 460, 264, "left")
        DRAW.text(PROFILE.hat, 686, 264, "center")
        DRAW.text("Accessory", 460, 304, "left")
        DRAW.text(PROFILE.accessory, 686, 304, "center")
        DRAW.text("Pet", 460, 344, "left")

        PLAYER.draw(342,340)

		// Render all buttons
		this.drawButtons()
	}

	update(dt) {
		this.updateButtons(dt)
	}
}()