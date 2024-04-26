// Map menu; Displays map and allows quick travel (?)

MENUS["mapMenu"] = new class extends Menu {
	//Initialize
	constructor () {
		super(234,104, 560,350)
	}

	load () {
		this.openTimer = 0

		this.buttons = {}
		this.buttons["close"] = new Button("✖", ()=>{closeMenu()}, null, 740,128, 32,32)

		this.mapX = 23
		this.mapY = 25

		this.iconAnimationTimer = 0
	}

	keyPress(key) {
	}

	keyRelease(key) {
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
	
	draw() {
		// Window
		let scale = 1
		if (this.openTimer < 1) {
			scale = easing("easeOutBack", this.openTimer)
		}
		DRAW.image(IMG.menu, null, this.x+this.w*0.5, this.y+this.h*0.5, 0, scale, scale, 0.5, 0.5)

		// Map itself
		DRAW.setColor(255, 255, 255, scale)
		DRAW.image(IMG.map, SPRITE.map.getFrame(0,0), this.x+this.mapX, this.y+this.mapY)
		if (WORLD.areaMapLocation) {
			let l = WORLD.areaMapLocation
			DRAW.image(IMG.map, SPRITE.mapIcons.getFrame(Math.floor(this.iconAnimationTimer),0), this.x+this.mapX+l[0], this.y+this.mapY+l[1], 0, 1,1, 0.5,0.5)
		}

		// Map Border
		DRAW.setColor(112, 50, 16, scale)
		DRAW.setLineWidth(2)
		DRAW.rectangle(this.x+this.mapX+1, this.y+this.mapY+1, SPRITE.map.w-2, SPRITE.map.h-2, "line")

		// Text
		DRAW.setColor(255,255,255, scale)
		DRAW.setFont(FONT.caption, 3)
		DRAW.text(WORLD.areaName, 512, 152, "center")

		// Render all buttons
		this.drawButtons()
	}

	update(dt) {
		this.openTimer = Math.min(1, this.openTimer + 4*dt)

		this.iconAnimationTimer = (this.iconAnimationTimer + dt) % 2

		this.updateButtons(dt)
	}
}()