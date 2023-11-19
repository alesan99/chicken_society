//Customize Player Menu; Menu with options to modify player profile and customize chicken

MENUS["customization"] = new class extends Menu {
	//Initialize
	constructor () {
		super(234,104, 560,350)
	}

    load () {
		this.openTimer = 0

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
		this.buttons["name"] = new Button(PROFILE.name, ()=>{}, null, 625,162, 140,32)
        // Color
		this.buttons["color"] = new Button("Random", ()=>{
            PROFILE.color = [Math.floor(100 + Math.random()*155),
                Math.floor(100 + Math.random()*155),
                Math.floor(100 + Math.random()*155)];
            PLAYER.updateProfile(PROFILE, "sendToServer");
        }, null, 665,202, 100,32)
        // Head Item
		this.buttons["headLeft"] = new Button("<", ()=>{
			let keys = Object.keys(SAVEDATA.items.head);
			if (keys.length === 0) {
				PROFILE.head = false
			} else {
				PROFILE.head = keys[Math.floor(Math.random() * keys.length)];
			}
            PLAYER.updateProfile(PROFILE, "sendToServer");
        }, null, 605,242, 32,32)
		this.buttons["headRight"] = new Button(">", ()=>{
			let keys = Object.keys(SAVEDATA.items.head);
			if (keys.length === 0) {
				PROFILE.head = false
			} else {
				PROFILE.head = keys[Math.floor(Math.random() * keys.length)];
			}
            PLAYER.updateProfile(PROFILE, "sendToServer");
        }, null, 733,242, 32,32)
        // Face Item
		this.buttons["faceLeft"] = new Button("<", ()=>{
			let keys = Object.keys(SAVEDATA.items.face);
			if (keys.length == 0) {
				PROFILE.face = false
			} else {
				PROFILE.face = keys[Math.floor(Math.random() * keys.length)];
			}
			PLAYER.updateProfile(PROFILE, "sendToServer");
        }, null, 605,282, 32,32)
		this.buttons["faceRight"] = new Button(">", ()=>{
			let keys = Object.keys(SAVEDATA.items.face);
			if (keys.length == 0) {
				PROFILE.face = false
			} else {
				PROFILE.face = keys[Math.floor(Math.random() * keys.length)];
			}
			PLAYER.updateProfile(PROFILE, "sendToServer");
		}, null, 733,282, 32,32)
        // Body Item
		this.buttons["bodyLeft"] = new Button("<", ()=>{
			let keys = Object.keys(SAVEDATA.items.body);
			if (keys.length == 0) {
				PROFILE.body = false
			} else {
				PROFILE.body = keys[Math.floor(Math.random() * keys.length)];
			}
			PLAYER.updateProfile(PROFILE, "sendToServer");
        }, null, 605,322, 32,32)
		this.buttons["bodyRight"] = new Button(">", ()=>{
			let keys = Object.keys(SAVEDATA.items.body);
			if (keys.length == 0) {
				PROFILE.body = false
			} else {
				PROFILE.body = keys[Math.floor(Math.random() * keys.length)];
			}
			PLAYER.updateProfile(PROFILE, "sendToServer");
        }, null, 733,322, 32,32)
        // Pet
		this.buttons["pet"] = new Button("None", ()=>{}, null, 665,362, 100,32)
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
        DRAW.text("Chicken Profile", 512, 142, "center")

        DRAW.text("Display Name", 460, 184, "left")
        DRAW.text("Color", 460, 224, "left")
        DRAW.text("Head Item", 460, 264, "left")
        DRAW.text(PROFILE.head, 686, 264, "center")
        DRAW.text("Face Item", 460, 304, "left")
        DRAW.text(PROFILE.face, 686, 304, "center")
        DRAW.text("Body Item", 460, 344, "left")
        DRAW.text(PROFILE.body, 686, 344, "center")
        DRAW.text("Pet", 460, 384, "left")

        PLAYER.draw(342,340)

		// Render all buttons
		this.drawButtons()
	}

	update(dt) {
		this.openTimer = Math.min(1, this.openTimer + 4*dt)

		this.updateButtons(dt)
	}
}()