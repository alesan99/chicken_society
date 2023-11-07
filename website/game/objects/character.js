//Character object, a 'chicken' with a collision box and the ability to move

let dir_lookup = {up: 2, down: 0, left: 1, right: 1}

class Character extends PhysicsObject {
	//Initialize: spatialHash, x pos, y pos, width, height
	constructor (spatialHash, x, y, profile, area) {
		// Collision
		super(spatialHash,x,y)
		this.x = x || 0
		this.y = y || 0
		this.w = 70 //Width
		this.h = 40 //Height
		
		let bevel = 16 // bevel hitbox so you slide into doorways (TODO: Only do this for main player for performance reasons?)
		this.shape = new Shape(
			-this.w/2, -this.h+bevel,
			-this.w/2+bevel, -this.h,
			this.w/2-bevel, -this.h,
			this.w/2, -this.h+bevel,
			this.w/2, 0-bevel,
			this.w/2-bevel, 0,
			(-this.w/2)+bevel, 0,
			(-this.w/2), 0-bevel
		)

		this.active = true
		this.static = false
		this.setPosition(null,null)

		// Properties
		this.updateProfile(profile)
		this.speed = 200 //Speed (px/sec)
		this.controller = false //Is it being controlled?
		this.area = area || "" //Current area

		this.sx = 0 // Speed x
		this.sy = 0 // Speed y

		// Graphics
		this.sprite = SPRITE.chicken
		this.anim = new Animation(this.sprite, 0)
		this.anim.setFrame(0,0)
		this.walking = false
		this.oldwalking = this.walking
		this.dir = "down"
		this.flip = 1
		this.imageOffsety = 4

		this.timer = 0

		// Expressions
		this.bubbleText = false // string, show speech bubble over character
		this.bubbleTextWrapped = false // List of strings; represents each line of the speech bubble text
		this.bubbleTime = false // How long the bubble is visible (seconds)
		this.bubbleTimer = 0
	}

	// Move: direction normal x, direction normal y
	move(nx, ny) {
		this.sx = nx*this.speed
		this.sy = ny*this.speed

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
		// TODO: Remove?
		if (this.controller != PLAYER_CONTROLLER) {
			// Update other clients
			if ((this.sx == false && this.sy == false) != true) {

			} else {
				this.walking = false
			}
		}

		// Update Animation
		if (this.walking != this.oldwalking) {
			if (this.walking) { // Walk if moving
				this.anim.playAnimation(ANIM.walk[0], ANIM.walk[1])
			} else {
				this.anim.stopAnimation(0, null)
			}
		}
		if (!this.static) { // Don't update animation if not movable
			// Face in the current direction
			this.anim.setFrame(null, dir_lookup[this.dir])
			// Update walking or emote animation
			this.anim.update(dt)
		}

		// Dissapear chat bubble after few seconds
		if (this.bubbleTime != false) {
			this.bubbleTimer += dt
			if (this.bubbleTimer > this.bubbleTime) {
				this.bubbleTime = false
				this.bubbleText = false
			}
		}

		this.timer += dt
		this.oldwalking = this.walking
	}

	draw() {
		// Shadow
		DRAW.setColor(255,255,255,1.0)
		DRAW.image(IMG.shadow, null, this.x, this.y+this.imageOffsety +3, 0, 1, 1, 0.5, 1)

		// Chicken and accessories
		DRAW.setColor(this.color[0],this.color[1],this.color[2],1.0)
		DRAW.image(IMG.chicken, this.anim.getSprite(), this.x, this.y+this.imageOffsety, 0, this.flip, 1, 0.5, 1)

		DRAW.setColor(255,255,255,1.0)
		if ((this.accessory != false) && (IMG.accessory[this.accessory] != null) && (SPRITE.accessory[this.accessory] != null)) { // Accessory
			let x = this.x - (SPRITE.chicken.w/2)*this.flip + (ACCESSORYOFFSET[dir_lookup[this.dir]][this.anim.framex][0])*this.flip
			let y = this.y+this.imageOffsety - SPRITE.chicken.h + ACCESSORYOFFSET[dir_lookup[this.dir]][this.anim.framex][1]
			let centerX = IMG.accessory[this.accessory].center[dir_lookup[this.dir]][0]/SPRITE.accessory[this.accessory].w
			let centerY = IMG.accessory[this.accessory].center[dir_lookup[this.dir]][1]/SPRITE.accessory[this.accessory].h
			DRAW.image(IMG.accessory[this.accessory], SPRITE.accessory[this.accessory].getFrame(0, dir_lookup[this.dir]), x, y, CHICKENROTATION[this.anim.framex], this.flip, 1, centerX, centerY)
		}

		DRAW.image(IMG.chicken, this.anim.getSprite(null, 3), this.x, this.y+this.imageOffsety, 0, this.flip, 1, 0.5, 1) // Uncolored sprite
		
		if ((this.hat != false) && (IMG.hat[this.hat] != null) && (SPRITE.hat[this.hat] != null)) { // Hat
			let x = this.x - (SPRITE.chicken.w/2)*this.flip + (HATOFFSET[dir_lookup[this.dir]][this.anim.framex][0])*this.flip
			let y = this.y+this.imageOffsety - SPRITE.chicken.h + HATOFFSET[dir_lookup[this.dir]][this.anim.framex][1]
			let centerX = IMG.hat[this.hat].center[dir_lookup[this.dir]][0]/SPRITE.hat[this.hat].w
			let centerY = IMG.hat[this.hat].center[dir_lookup[this.dir]][1]/SPRITE.hat[this.hat].h
			DRAW.image(IMG.hat[this.hat], SPRITE.hat[this.hat].getFrame(0, dir_lookup[this.dir]), x, y, CHICKENROTATION[this.anim.framex], this.flip, 1, centerX, centerY)
		}
	}

	drawOver() {
		// Nametag
		DRAW.setFont(FONT.caption, 4)
		DRAW.setColor(255,255,255,1)
		DRAW.text(this.name, Math.floor(this.x), Math.floor(this.y)-115, "center")

		// Chat bubble
		if (this.bubbleText != false) {
			let offsetY = 130

			// Goofy chat bubble animation
			// Slowly embiggen bubble
			let animLength = 1/6
			let endAnimLength = 1/8
			let scale = 1
			if (this.bubbleTimer < animLength) {
				// Grow
				let t = Math.min(1, this.bubbleTimer/animLength) // Animation position
				scale = easing("easeOutQuad", t)
			} else if (this.bubbleTimer > this.bubbleTime-endAnimLength) {
				// Shrink
				let t = Math.min(1, (this.bubbleTime-this.bubbleTimer)/endAnimLength) // Animation position
				scale = easing("easeOutQuad", t)
			}
			// Wiggle bubble
			let flip = 1-Math.floor((this.bubbleTimer%1)*2)*2
			
			DRAW.setColor(255,255,255,1.0)
			DRAW.image(IMG.chatBubble, null, this.x, Math.max(100, Math.floor(this.y) -offsetY), 0, scale*flip, scale, 0.5, 1)

			// Render wrapped text so it fits into the bubble
			DRAW.setFont(FONT.chatBubble)
			DRAW.setColor(0,0,0,scale**2)

			let verticalSpacing = 18
			for (let line = 0; line < this.bubbleTextWrapped.length; line++) {
				let textSegment = this.bubbleTextWrapped[line]
				DRAW.text(textSegment, Math.floor(this.x), Math.max(100, Math.floor(this.y) -offsetY) + line*verticalSpacing-(this.bubbleTextWrapped.length*verticalSpacing/2)-41, "center")
			}
		}
	}

	// Update appearance based on given profile
	updateProfile(profile, sendToServer) {
		this.name = profile.name || "" //name
		this.color = profile.color || [255,255,255]
		this.hat = profile.hat || false
		this.accessory = profile.accessory || false
		//Send profile to server if this is the player
		if (sendToServer && this.controller == PLAYER_CONTROLLER) {
			if (NETPLAY != false) {
				NETPLAY.sendProfile(PROFILE)
			}
		}
	}

	// Display speech bubble
	chatBubble(text, time) {
		this.bubbleText = text
		this.bubbleTime = time || 4
		this.bubbleTimer = 0

		// Wrap text so it fits in text bubble
		this.bubbleTextWrapped = []

		let fullText = this.bubbleText
		let lineLength = 15 // How many characters can fit in a single line?
		let line = 0
		let i = 0
		while (i < fullText.length) {
			let i2 = Math.min(i+lineLength, fullText.length)
			let lineString = fullText.substring(i, i2)
			// Check if line ended in the middle of a word
			let lastChar = fullText.substring(i2, i2)
			let nextChar = fullText.substring(i2+1, i2+1)
			// Wrap at closest space if next word is cut-off
			if (lineString.length == lineLength && lastChar != " " && nextChar != " ") {
				let closestSpace = lineString.lastIndexOf(" ")
				if (closestSpace != -1) { // Only separate at last space if an instance was found
					i2 = i+closestSpace
				}
			}

			// Add line to list of lines
			let textSegment = fullText.substring(i, i2).trim()
			this.bubbleTextWrapped.push(textSegment)
			i = i2+1
			line += 1
		}
	}

	// Play emote animation; will stop when player moves
	emote(i) {
		if (ANIM[i] != null) {
			this.dir = "down"
			this.anim.playAnimation(ANIM[i][0], ANIM[i][1], 0)
		}
	}

	// Collision
	collide(name, obj, nx, ny) {
		if (name == "Character" || name == "Trigger") {
			return false
		}
		return true
	}
}