//Chat Menu; Menu with input field for chat messages and buttons for emotes and settings

MENUS["chatMenu"] = new class extends Menu {
	//Initialize
	constructor () {
		super(202,525, 620,51)
	}

	load() {
		this.value = ""
		this.open = false
		this.typing = false
		this.timer = 0

		this.messages = [] // All chat messages recieved
		this.messageLogTimer = 0 // How long left to display last message

		this.nuggets = SAVEDATA.nuggets // Nugget display. This is a rolling counter so it isn't exactly the same as SAVEDATA.nuggets
		this.nuggetDiff = false // How many nuggets earned/lost
		this.nuggetTimer = 0 // Nugget animation when you get more nuggets

		this.emoteMenu = MENUS["emoteMenu"]
		this.emoteMenu.load()
		this.emoteMenuOpen = false

		this.buttons = {}
		this.buttons[0] = new Button(false, ()=>{this.emoteMenuOpen = !this.emoteMenuOpen}, {image: IMG.chat, frames:[SPRITE.chatButton.getFrame(0,0),SPRITE.chatButton.getFrame(1,0),SPRITE.chatButton.getFrame(2,0)]}, 216,535, 34,34) 
		this.buttons[1] = new Button(false, ()=>{this.enter()}, {image: IMG.chat, frames:[SPRITE.chatButton.getFrame(0,1),SPRITE.chatButton.getFrame(1,1),SPRITE.chatButton.getFrame(2,1)]}, 661,535, 34,34) 
		this.buttons[2] = new Button(false, ()=>{if (getOpenMenu() != "customization") {openMenu("customization")} else {closeMenu()}}, {image: IMG.chat, frames:[SPRITE.chatButton.getFrame(0,2),SPRITE.chatButton.getFrame(1,2),SPRITE.chatButton.getFrame(2,2)]}, 699,535, 34,34) 
		this.buttons[3] = new Button(false, ()=>{if (getOpenMenu() != "mapMenu") {openMenu("mapMenu")} else {closeMenu()}}, {image: IMG.chat, frames:[SPRITE.chatButton.getFrame(0,3),SPRITE.chatButton.getFrame(1,3),SPRITE.chatButton.getFrame(2,3)]}, 737,535, 34,34) 
		this.buttons[4] = new Button(false, ()=>{if (getOpenMenu() != "usersMenu") {openMenu("usersMenu")} else {closeMenu()}}, {image: IMG.chat, frames:[SPRITE.chatButton.getFrame(0,4),SPRITE.chatButton.getFrame(1,4),SPRITE.chatButton.getFrame(2,4)]}, 775,535, 34,34) 

		this.textField = document.getElementById('gameTextInput');
		this.textField.addEventListener('keydown', (event) => {
			if (event.key === 'Enter' || event.code === 'Enter') {
				this.enter()
			}
		});
		this.buttons[5] = new Button(false, ()=>{this.open = true; this.typing = true; this.timer = 0; this.textField.focus()}, {visible: false}, 255,534, 406,36) 
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
				case "/head":
					PROFILE.head = arg
					PLAYER.updateProfile(PROFILE, "sendToServer")
					break
				case "/face":
					PROFILE.face = arg
					PLAYER.updateProfile(PROFILE, "sendToServer")
					break
				case "/body":
					PROFILE.body = arg
					PLAYER.updateProfile(PROFILE, "sendToServer")
					break
				case "/scale": // Chicken size
					PROFILE.scale = arg
					PLAYER.updateProfile(PROFILE, "sendToServer")
					break
				case "/speed": // Chicken speed
					PLAYER.speed = arg
					break
				case "/area": // Warp to a different area
					WORLD.loadArea(arg, "chatWarp")
					break
				case "/minigame": // Start minigame
					setState(MINIGAME, arg)
					break
				case "/emote": // Play emote animation
					PLAYER.emote(arg)
					break
				case "/nuggets":
					// SAVEDATA.nuggets = Number(arg)
					addNuggets(Number(arg))
					// PLAYER.updateProfile(PROFILE, "sendToServer")
					break
				case "/debug": // Debug physics
					DEBUGPHYSICS = !DEBUGPHYSICS
					break
			}
		} else if (this.value.length > 0) {
			// Send chat message
			let message = this.value.substring(0, 15*3+2) // Max chat length
			PLAYER.chatBubble(message)
			NETPLAY.sendChat(message)
		}

		this.value = ""
		this.open = false
		this.typing = false
		this.textField.value = ""
		this.textField.blur()
	}

	// Display chat message and add to chat log.
	message(message, name=false, display=true) {
		let text = message
		if (name) {
			text = `${name}: ${message}`
		}
		this.messages.push(text)
		if (display) {
			this.messageLogTimer = 4
		}
	}

	update(dt) {
		// Update chat log display
		this.messageLogTimer = Math.max(0, this.messageLogTimer - dt)

		this.timer = (this.timer + dt)%1 // Blinking cursor

		this.value = this.textField.value

		// Update nugget animation
		if (this.nuggetTimer > 0) {
			this.nuggetTimer = this.nuggetTimer - 1.4*dt
			if (this.nuggetTimer < 0) {
				this.nuggetTimer = 0
				this.nuggetDiff = false
			}
		}
		let speed = Math.max(Math.abs(SAVEDATA.nuggets-this.nuggets)*0.5, 1)
		if (this.nuggets > SAVEDATA.nuggets) {
			this.nuggets = Math.max(SAVEDATA.nuggets, this.nuggets - speed*10*dt)
		} else if (this.nuggets < SAVEDATA.nuggets) {
			this.nuggets = Math.min(SAVEDATA.nuggets, this.nuggets + speed*10*dt)
		}

		this.updateButtons(dt)

		// Emote Menu
		if (this.emoteMenuOpen) {
			this.emoteMenu.update(dt)
		}
	}
	
	draw() {
		// Placeholder graphic
		DRAW.setColor(255,255,255,1.0)
		DRAW.image(IMG.chat, SPRITE.chat.getFrame(0,0), 202, 525)

		// Render all buttons
		this.drawButtons()

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

		// Display chat messages
		if (this.messageLogTimer > 0) {
			DRAW.setColor(255, 255, 255, 1)
			DRAW.image(IMG.chatMessage, null, 212, 490)
			DRAW.setFont(FONT.caption)
			DRAW.setColor(0, 0, 0, 1)
			DRAW.text(this.messages[this.messages.length - 1], 226, 515, "left")
		}

		// Emote Menu
		if (this.emoteMenuOpen) {
			this.emoteMenu.draw()
		}

		// Nugget HUD display
		let displayString = `✖ ${Math.floor(this.nuggets).toLocaleString()}`
		DRAW.image(IMG.nugget, null, 12, 526)
		DRAW.setFont(FONT.hud)
		DRAW.setColor(0,0,0,1.0)
		DRAW.text(displayString, 60, 556+4, "left")
		DRAW.setColor(255,255,255,1.0)
		DRAW.text(displayString, 60, 556, "left")
		// Nugget animation when nuggets change
		if (this.nuggetDiff) {
			let diffText = `${this.nuggetDiff.toLocaleString()}` // Show difference. Either in the form -10 or +10
			if (this.nuggetDiff >= 0) {
				diffText = "+" + diffText
			}
			DRAW.setColor(255,255,255,this.nuggetTimer)
			DRAW.text(diffText , 90, 556-20-10*(1-this.nuggetTimer), "left")
		}

		DRAW.setColor(255,255,255,1.0)
		DRAW.image(IMG.ammo, null, 904, 526)
	}

	keyPress(key) {
		if (((key == "/" || key == "\\") && !this.typing) || (key == "Escape" && this.typing)) {
			// Start Typing
			this.typing = !this.typing
			this.open = !this.open
			if (this.typing) {
				this.timer = 0
				this.textField.focus()
			}
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
		// Emote Menu
		if (this.emoteMenuOpen) {
			if (this.emoteMenu.mouseClick(button, x, y)) {
				return true
			} else {
				this.emoteMenuOpen = false
				return true
			}
		}
		return super.mouseClick(button, x, y)
	}

	mouseRelease(button, x, y) {
		// Emote Menu
		if (this.emoteMenuOpen) {
			if (this.emoteMenu.mouseRelease(button, x, y)) {
				return true
			}
		}
		return super.mouseRelease(button, x, y)
	}

	nuggetCounter(nuggets) {
		// Play nugget animation
		this.nuggetDiff = nuggets
		this.nuggetTimer = 1
	}
}()