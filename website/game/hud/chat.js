//Chat Object; Open up menu with 
var BUTT_RED

class ChatObject {
	//Initialize
	constructor () {
		this.value = ""
		this.open = false
		this.typing = false
		this.timer = 0

		this.buttons = []
		this.buttons[0] = new Button(false, ()=>{PLAYER.emote("wave")}, {image: IMG.chat, frames:[SPRITE.chatButton.getFrame(0,0),SPRITE.chatButton.getFrame(1,0),SPRITE.chatButton.getFrame(2,0)]}, 216,535, 34,34) 
		this.buttons[1] = new Button(false, ()=>{this.enter()}, {image: IMG.chat, frames:[SPRITE.chatButton.getFrame(0,1),SPRITE.chatButton.getFrame(1,1),SPRITE.chatButton.getFrame(2,1)]}, 661,535, 34,34) 
		this.buttons[2] = new Button(false, ()=>{PLAYER.chatBubble("Customization Menu")}, {image: IMG.chat, frames:[SPRITE.chatButton.getFrame(0,2),SPRITE.chatButton.getFrame(1,2),SPRITE.chatButton.getFrame(2,2)]}, 699,535, 34,34) 
		this.buttons[3] = new Button(false, ()=>{PLAYER.chatBubble("Map")}, {image: IMG.chat, frames:[SPRITE.chatButton.getFrame(0,3),SPRITE.chatButton.getFrame(1,3),SPRITE.chatButton.getFrame(2,3)]}, 737,535, 34,34) 
		this.buttons[4] = new Button(false, ()=>{PLAYER.chatBubble("GET FUCKED")}, {image: IMG.chat, frames:[SPRITE.chatButton.getFrame(0,4),SPRITE.chatButton.getFrame(1,4),SPRITE.chatButton.getFrame(2,4)]}, 775,535, 34,34) 

		this.buttons[5] = new Button(false, ()=>{this.open = true; this.typing = true; this.timer = 0}, {visible: false}, 255,534, 406,36) 
	}

	enter() {
		if (this.value.substring(0, 1) == "/") {
			// Execute command
			let s = this.value.split(" ")
			let [command, arg, arg2, arg3] = [s[0], s[1], s[2], s[3]]
			
			console.log(command, arg)
			switch (command) {
				case "/name":
					PROFILE.name = arg
					PLAYER.updateProfile(PROFILE, "sendToServer")
					break
				case "/color":
					PROFILE.color = [Number(arg), Number(arg2), Number(arg3)]
					PLAYER.updateProfile(PROFILE, "sendToServer")
					break
				case "/hat":
					PROFILE.hat = arg
					PLAYER.updateProfile(PROFILE, "sendToServer")
					break
				case "/accessory":
					PROFILE.accessory = arg
					PLAYER.updateProfile(PROFILE, "sendToServer")
					break
				case "/area": // Warp to a different area
					WORLD.loadArea(arg, "chatWarp")
					break
				case "/emote": // Play emote animation
					PLAYER.emote(arg)
					break
				case "/nuggets":
					SAVEDATA.nuggets = Number(arg)
					// PLAYER.updateProfile(PROFILE, "sendToServer")
					break
				case "/debug": // Debug physics
					DEBUGPHYSICS = true
					break
			}
		} else {
			// Send chat message
			let message = this.value.substring(0, 15*3) // Max chat length
			PLAYER.chatBubble(message)
			if (NETPLAY != false) {
				NETPLAY.sendChat(message)
			}
		}

		this.value = ""
		this.open = false
		this.typing = false
	}

	keyPress(key) {
		if (((key == "/" || key == "\\") && !this.typing) || (key == "Escape" && this.typing)) {
			// Start Typing
			this.typing = !this.typing
			this.open = !this.open
		} else if (this.typing) {
			// Add character to input bar
			if (key.length == 1) {
				// Only add character if it can fit
				DRAW.setFont(FONT.caption)
				if (DRAW.getTextWidth(this.value + key) < 396) {
					this.value += key
				}
			} else if (key == "Backspace") {
				this.value = this.value.substring(0, this.value.length-1)
			} else if (key == "Enter") {
				this.enter()
			}
		}
	}

	keyRelease(key) {
		
	}

	mouseClick(button, x, y) {
		for (let button of this.buttons) {
			if (button.click(button, x, y)) {
				return true
			}
		}
		return false
	}

	mouseRelease(button, x, y) {
		for (let button of this.buttons) {
			if (button.clickRelease(button, x, y)) {
				return true
			}
		}
		return false
	}
	
	draw() {
		// Placeholder graphic
		DRAW.setColor(255,255,255,1.0)
		DRAW.image(IMG.chat, SPRITE.chat.getFrame(0,0), 202, 525)

		// Nugget display
		let displayString = `✖ ${SAVEDATA.nuggets.toLocaleString()}`
		DRAW.image(IMG.nugget, null, 12, 526)
		DRAW.setFont(FONT.hud)
		DRAW.setColor(0,0,0,1.0)
		DRAW.text(displayString, 60, 556+4, "left")
		DRAW.setColor(255,255,255,1.0)
		DRAW.text(displayString, 60, 556, "left")

		DRAW.image(IMG.ammo, null, 904, 526)

		// Render all buttons
		for (let button of this.buttons) {
			button.draw()
		}

		// Display whats being typed
		if (this.open) {
			// DRAW.setColor(0,0,0,0.5)
			// DRAW.rectangle(0, canvasHeight-40, canvasWidth, 30)
			DRAW.setFont(FONT.caption)
			DRAW.setColor(0, 0, 0, 1)
			let s = this.value
			if (this.timer <= 0.5) {
				s += "|"
			}
			DRAW.text(s, 262, canvasHeight-19, "left")
		}
	}

	update(dt) {
		this.timer = (this.timer + dt)%1
		for (let button of this.buttons) {
			button.update(dt)
		}
	}
}