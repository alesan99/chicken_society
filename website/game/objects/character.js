//Character object, a 'chicken' with a collision box and the ability to move

let dir_lookup = {up: 2, down: 0, left: 1, right: 1}

class Character {
	//Initialize: x pos, y pos, width, height
	constructor (x, y, profile) {
		// Collision
		this.x = x || 0
		this.y = y || 0
		this.oldx = this.x
		this.oldy = this.y
		this.w = 80 //Width
		this.h = 60 //Height
		
		this.shape = [
			0, 0,
			this.w, 0,
			this.w, this.h,
			0, this.h
		]

		this.active = true
		this.static = false

		// Properties
		this.updateProfile(profile)
		this.speed = 200 //Speed (px/sec)
		this.controller = false //Is it being controlled?
		this.area = "" //Current area

		this.sx = false // Speed x
		this.sy = false // Speed y

		// Graphics
		this.sprite = SPRITE.chicken
		this.anim = new Animation(this.sprite, 0)
		this.anim.setFrame(0,0)
		this.walking = false
		this.oldwalking = this.walking
		this.dir = "down"
		this.flip = 1

		this.timer = 0

		// Expressions
		this.bubbleText = false // string, show speech bubble over character
		this.bubbleTime = false // How long the bubble is visible (seconds)
	}

	// Move: dt, direction normal x, direction normal y
	move(dt, nx, ny) {
		this.oldx = this.x
		this.oldy = this.y
		this.x += nx*this.speed*dt
		this.y += ny*this.speed*dt

		// Find direction player is facing
		this.walking = true
		if ((nx == 0) && (ny == 0)) {
			this.walking = false
		} else if (Math.abs(ny) >= Math.abs(nx)) {
			if (ny > 0) {
				this.dir = "down" // Down
				this.flip = 1
			} else {
				this.dir = "up" // Up
				this.flip = 1
			}
		} else {
			if (nx > 0) {
				this.dir = "right" // Right
				this.flip = 1
			} else {
				this.dir = "left" // Left
				this.flip = -1
			}
		}
	}

	update(dt) {
		// Update movement
		if (this.controller != PLAYER_CONTROLLER) {
			// Update other clients
			if ((this.sx == false && this.sy == false) != true) {
				this.move(dt, this.sx, this.sy)
			} else {
				this.walking = false
			}
			console.log(this.walking, this.oldwalking, this.sy)
		}

		// Update Animation
		if (this.walking != this.oldwalking) {
			if (this.walking) {
				this.anim.playAnimation(ANIM.walk[0], ANIM.walk[1])
			} else {
				this.anim.stopAnimation(null)
			}
		}
		// Face in the current direction
		this.anim.setFrame(null, dir_lookup[this.dir])
		// Update walking or emote animation
		this.anim.update(dt)

		// Dissapear chat bubble after few seconds
		if (this.bubbleTime != false) {
			this.bubbleTime -= dt
			if (this.bubbleTime < 0) {
				this.bubbleTime = false
				this.bubbleText = false
			}
		}

		this.timer += dt
		this.oldwalking = this.walking
	}

	draw() {
		//DRAW.setColor(0,0,0,0.3)
		//DRAW.rectangle(this.x, this.y, this.w, this.h) //collision

		// Chicken and accessories
		DRAW.setColor(this.color[0],this.color[1],this.color[2],1.0)
		DRAW.image(IMG.chicken, this.anim.getSprite(), this.x+this.w/2, this.y+this.h, 0, this.flip, 1, 0.5, 1)

		DRAW.setColor(255,255,255,1.0)
		if ((this.accessory != false) && (IMG.accessory[this.accessory] != null) && (SPRITE.accessory[this.accessory] != null)) { // Accessory
			let x = this.x+this.w/2 - (SPRITE.chicken.w/2)*this.flip + (ACCESSORYOFFSET[dir_lookup[this.dir]][this.anim.framex][0])*this.flip
			let y = this.y+this.h - SPRITE.chicken.h + ACCESSORYOFFSET[dir_lookup[this.dir]][this.anim.framex][1]
			let centerX = IMG.accessory[this.accessory].center[dir_lookup[this.dir]][0]/SPRITE.accessory[this.accessory].w
			let centerY = IMG.accessory[this.accessory].center[dir_lookup[this.dir]][1]/SPRITE.accessory[this.accessory].h
			DRAW.image(IMG.accessory[this.accessory], SPRITE.accessory[this.accessory].getFrame(0, dir_lookup[this.dir]), x, y, 0, this.flip, 1, centerX, centerY)
		}

		DRAW.image(IMG.chicken, this.anim.getSprite(null, 3), this.x+this.w/2, this.y+this.h, 0, this.flip, 1, 0.5, 1) // Uncolored sprite
		
		if ((this.hat != false) && (IMG.hat[this.hat] != null) && (SPRITE.hat[this.hat] != null)) { // Hat
			let x = this.x+this.w/2 - (SPRITE.chicken.w/2)*this.flip + (HATOFFSET[dir_lookup[this.dir]][this.anim.framex][0])*this.flip
			let y = this.y+this.h - SPRITE.chicken.h + HATOFFSET[dir_lookup[this.dir]][this.anim.framex][1]
			let centerX = IMG.hat[this.hat].center[dir_lookup[this.dir]][0]/SPRITE.hat[this.hat].w
			let centerY = IMG.hat[this.hat].center[dir_lookup[this.dir]][1]/SPRITE.hat[this.hat].h
			DRAW.image(IMG.hat[this.hat], SPRITE.hat[this.hat].getFrame(0, dir_lookup[this.dir]), x, y, 0, this.flip, 1, centerX, centerY)
		}

		// Nametag
		DRAW.setFont(FONT.caption, 4)
		DRAW.setColor(255,255,255,1)
		DRAW.text(this.name, Math.floor(this.x)+this.w/2, Math.floor(this.y)-75, "center")

		// Chat bubble
		if (this.bubbleText != false) {
			DRAW.setFont(FONT.chatBubble)
			DRAW.setColor(255,255,255,1.0)
			
			DRAW.image(IMG.chatBubble, null, this.x+this.w/2, Math.max(100, Math.floor(this.y) -80), 0, 1, 1, 0.5, 1)
			DRAW.setColor(1,0,0,1)

			// Wrap text so it fits into the bubble
			let text = this.bubbleText
			let lineLength = 15 // How many characters can fit in a single line?
			let line = 0
			let verticalSpacing = 18
			for (let i = 0; i < text.length; i += lineLength) {
				let textSegment = text.substring(i, i+lineLength)
				DRAW.text(textSegment, Math.floor(this.x)+this.w/2, Math.max(100, Math.floor(this.y) -80) + line*verticalSpacing-68, "center")
				line += 1
			}
		}
	}

	// Update appearance based on given profile
	updateProfile(profile) {
		this.name = profile.name || "NPC" //name
		this.color = profile.color || [255,255,255]
		this.hat = profile.hat || false
		this.accessory = profile.accessory || false
		//Send profile to server if this is the player
		if (this.controller == PLAYER_CONTROLLER) {
			if (NETPLAY != false) {
				NETPLAY.sendProfile(PROFILE)
			}
		}
	}

	// Display speech bubble
	chatBubble(text) {
		this.bubbleText = text
		this.bubbleTime = 4
	}

	// Play emote animation; will stop when player moves
	emote(i) {
		if (ANIM[i] != null) {
			this.anim.playAnimation(ANIM[i][0], ANIM[i][1], 0)
		}
	}
}


function wrapText(text, lineLength) {
	if (typeof text !== 'string' || typeof lineLength !== 'number' || lineLength <= 0) {
	  return text
	}
  
	let result = ''
	for (let i = 0; i < text.length; i += lineLength) {
	  result += text.substring(i, lineLength) + '\n'
	}
  
	return result
}