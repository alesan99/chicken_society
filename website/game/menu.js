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

	keyPress(key, code) {
		// Test click on all buttons
		for (const [name, button] of Object.entries(this.buttons)) {
			if (button.keyPress && button.keyPress(key, code)) {
				return true
			}
		}
	}

	keyRelease(key, code) {
		// Test click on all buttons
		for (const [name, button] of Object.entries(this.buttons)) {
			if (button.keyRelease && button.keyRelease(key, code)) {
				return true
			}
		}
	}

	checkMouseInside(){
		let [mouseX, mouseY] = getMousePos(); //returns x and y pos of mouse
		if (mouseX > this.x && mouseX < this.x + this.w && mouseY > this.y && mouseY < this.y + this.h) {
			return true;
		}
		return false;
	}

	mouseClick(button, x, y) {
		// Test click on all buttons
		let buttonClicked = false
		for (const [name, button] of Object.entries(this.buttons)) {
			if (button.click(button, x, y)) {
				buttonClicked = true
			}
		}
		if (buttonClicked) {
			return true
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