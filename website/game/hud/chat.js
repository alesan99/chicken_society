//Chat Object; Open up menu with 

class ChatObject {
	//Initialize
	constructor () {
		this.value = ""
		this.open = false
		this.typing = false
		this.timer = 0
		// var BUTT_RED
		BUTT_RED = new Button(false, ()=>{PLAYER.chatBubble("GET FUCKED"); console.log("jeyeyeyeyeyeyeyey")}, 50,50,200,200) 

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
					if (NETPLAY != false) {
						NETPLAY.sendEmote(arg)
					}
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
			this.typing = !this.typing
			this.open = !this.open
		} else if (this.typing) {
			if (key.length == 1) {
				this.value += key
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
		BUTT_RED.click(button, x, y)
			
		
		
	}

	mouseRelease(button, x, y) {
		BUTT_RED.clickRelease(button, x, y)
	}


	draw() {
		// Placeholder graphic
		DRAW.setColor(255,255,255,1.0)
		DRAW.image(IMG.chat, null, canvasWidth/2-IMG.chat.w/2, canvasHeight-IMG.chat.h)

		// Display whats being typed
		if (this.open) {
			DRAW.setColor(0,0,0,0.5)
			DRAW.rectangle(0, canvasHeight-40, canvasWidth, 30)
			DRAW.setFont(FONT.caption)
			DRAW.setColor(255,255,255,1)
			let s = this.value
			if (this.timer > 0.5) {
				s += "|"
			}
			DRAW.text(s, 40, canvasHeight-20, "left")
		}
		BUTT_RED.draw()

	}

	update(dt) {
		this.timer = (this.timer + dt)%1
		BUTT_RED.update(dt)

	}
}