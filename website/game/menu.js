// Menu; A pop-up window/container of buttons and other GUI
class Menu {
	constructor (x=0, y=0, w, h) {
        this.x = x
        this.y = y
        this.w = w
        this.h = h
    }

    load() {
        this.buttons = {}
    }

    close() {
        closeMenu()
    }

    updateButtons(dt) {
		// Update all buttons
		for (const [name, button] of Object.entries(this.buttons)) {
			button.update(dt)
		}
    }

    drawButtons() {
		// Render all buttons
		for (const [name, button] of Object.entries(this.buttons)) {
			button.draw()
		}
    }

    keyPress(key) {

    }

    keyRelease(key) {

    }

	mouseClick(button, x, y) {
		// Test click on all buttons
		for (const [name, button] of Object.entries(this.buttons)) {
			if (button.click(button, x, y)) {
				return true
			}
		}
        // Don't click on anything below if mouse is in menu
        if (checkMouseInside(this.x, this.y, this.w, this.h)) {
            return true
		}
		return false
	}

	mouseRelease(button, x, y) {
		for (const [name, button] of Object.entries(this.buttons)) {
			if (button.clickRelease(button, x, y)) {
				return true
			}
		}
		return false
	}

	mouseScroll(dy) {
		for (const [name, button] of Object.entries(this.buttons)) {
			if (button.mouseScroll && button.mouseScroll(dy)) {
				return true
			}
		}
		return false
	}
}

var MENUS = {}