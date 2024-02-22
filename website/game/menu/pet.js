// Pet menu; Shows your pet's status

MENUS["petMenu"] = new class extends Menu {
	//Initialize
	constructor () {
		super(234,104, 560,350)
	}

    load (config) {
		this.openTimer = 0

		this.buttons = {}
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
		DRAW.text("Pet", 512, this.y+38, "center")

		// Render all buttons
		this.drawButtons()
	}

	update(dt) {
		this.openTimer = Math.min(1, this.openTimer + 4*dt)

		this.updateButtons(dt)
	}
}()