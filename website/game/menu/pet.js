// Pet menu; Shows your pet's status

MENUS["petMenu"] = new class extends Menu {
	//Initialize
	constructor () {
		super(234,104, 560,350)
	}

	load (config) {
		this.openTimer = 0

		this.buttons = {}
		this.buttons["close"] = new Button("X", ()=>{closeMenu()}, null, 740,128, 32,32)

		// Get Pet information
		this.pet = PLAYER.petObj

		this.petMood = this.pet.getMood()

		// Name
		this.buttons["name"] = new Button(SAVEDATA.pet.name, ()=>{}, null, 292,129, 140,32)
	}

	keyPress(key) {
	}

	keyRelease(key) {
	}

	mouseClick(button, x, y) {
		let clicked = super.mouseClick(button, x, y)
		if (!clicked) {
			closeMenu()
		}
		return clicked
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

		DRAW.setColor(112, 50, 16, scale)
		DRAW.setFont(FONT.caption)

		// Pet
		this.pet.draw(360,340,"down")

		// Pet Status
		DRAW.setColor(112, 50, 16, scale)
		DRAW.text(`Feeling ${this.petMood}.`, 476, 184, "left")
		DRAW.text("Health", 476, 224, "left")
		DRAW.text("Hunger", 476, 284, "left")

		DRAW.setColor(240, 240, 240, scale)
		DRAW.rectangle(476, 238, 200, 20)
		DRAW.rectangle(476, 298, 200, 20)
		DRAW.setColor(20, 200, 20, scale)
		DRAW.rectangle(476, 238+1, 200*(this.pet.health), 18)
		DRAW.rectangle(476, 298+1, 200*(this.pet.hunger), 18)

		// Render all buttons
		this.drawButtons()
	}

	update(dt) {
		this.openTimer = Math.min(1, this.openTimer + 4*dt)

		this.updateButtons(dt)
	}
}()