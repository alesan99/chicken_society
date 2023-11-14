// Map menu; Displays map and allows quick travel (?)

MENUS["mapMenu"] = new class extends Menu {
	//Initialize
	constructor () {
		super(234,104, 560,350)
	}

    load (config) {
		this.buttons = {}
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
        DRAW.text("Map", 512, 142, "center")

		// Render all buttons
		this.drawButtons()
	}

	update(dt) {
		this.updateButtons(dt)
	}
}()