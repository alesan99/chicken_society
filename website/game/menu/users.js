// Users menu; Displays all connected users

MENUS["usersMenu"] = new class extends Menu {
	//Initialize
	constructor () {
		super(234,104, 560,350)
	}

    load (config) {
		this.openTimer = 0

		this.buttons = {}
		this.buttons["close"] = new Button("X", ()=>{closeMenu()}, null, 740,128, 32,32)

		// Get list of connected player names
		this.connectedPlayers = [PROFILE.name]
		if (NETPLAY.playerList) {
			console.log(NETPLAY.playerList)
			for (const [id, data] of Object.entries(NETPLAY.playerList)) {
				this.connectedPlayers.push(data.profile.name)
			}
		}
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
        DRAW.text("Connected Players", 512, 142, "center")

		for (let i=0; i<this.connectedPlayers.length; i++) {
			DRAW.text(this.connectedPlayers[i], this.x+20, this.y+80+25*i, "left")
		}

		// Render all buttons
		this.drawButtons()
	}

	update(dt) {
		this.openTimer = Math.min(1, this.openTimer + 4*dt)

		this.updateButtons(dt)
	}
}()