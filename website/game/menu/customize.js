//Customize Player Menu; Menu with options to modify player profile and customize chicken

MENUS["customizeMenu"] = new class extends Menu {
	//Initialize
	constructor () {
		super(234,104, 560,350)
	}

    load () {
		this.buttons = {}
		this.buttons[0] = new Button("Confirm", ()=>{closeMenu()}, null, 665,399, 100,32)

        // Name
		this.buttons[1] = new Button("Confirm", ()=>{}, null, 665,162, 100,32)
        // Color
		this.buttons[2] = new Button("Random", ()=>{
            PROFILE.color = [Math.floor(100 + Math.random()*155),
                Math.floor(100 + Math.random()*155),
                Math.floor(100 + Math.random()*155)];
            PLAYER.updateProfile(PROFILE, "sendToServer");
        }, null, 665,202, 100,32)
        // Hat
		this.buttons[3] = new Button("Random", ()=>{
            PROFILE.hat = SAVEDATA.hats[Math.floor(Math.random()*SAVEDATA.hats.length)];
            PLAYER.updateProfile(PROFILE, "sendToServer");
        }, null, 665,242, 100,32)
        // Accessory
		this.buttons[4] = new Button("Random", ()=>{
            PROFILE.accessory = SAVEDATA.accessories[Math.floor(Math.random()*SAVEDATA.accessories.length)];
			PLAYER.updateProfile(PROFILE, "sendToServer");
        }, null, 665,282, 100,32)
        // Pet
		this.buttons[5] = new Button("Confirm", ()=>{}, null, 665,322, 100,32)
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
        DRAW.text("Chicken Profile", 520, 142, "center")

        DRAW.text("Display Name", 520, 184, "left")
        DRAW.text("Color", 520, 224, "left")
        DRAW.text("Hat", 520, 264, "left")
        DRAW.text("Accessory", 520, 304, "left")
        DRAW.text("Pet", 520, 344, "left")

        PLAYER.draw(362,340)

		// Render all buttons
		this.drawButtons()
	}

	update(dt) {
		this.updateButtons(dt)
	}
}()