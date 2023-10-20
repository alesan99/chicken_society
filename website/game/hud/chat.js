//Chat Object; Open up menu with 

class ChatObject {
	//Initialize
	constructor () {
		this.value = ""
		this.open = false
		this.typing = false

		this.timer = 0
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
					PLAYER.updateProfile(PROFILE)
					break
				case "/color":
					PROFILE.color = [Number(arg), Number(arg2), Number(arg3)]
					PLAYER.updateProfile(PROFILE)
					break
				case "/hat":
					PROFILE.hat = arg
					PLAYER.updateProfile(PROFILE)
					break
				case "/accessory":
					PROFILE.accessory = arg
					PLAYER.updateProfile(PROFILE)
					break
				case "/area": // Warp to a different area
					PLAYER.area = arg
					break
				case "/emote": // Play emote animation
					PLAYER.emote(arg)
					if (NETPLAY != false) {
						NETPLAY.sendEmote(arg)
					}
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
		if ((key == "/" && !this.typing) || (key == "Escape" && this.typing)) {
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

	draw() {
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
	}

	update(dt) {
		this.timer = (this.timer + dt)%1
	}
}