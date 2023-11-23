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
		this.visibleDir = this.dir //direction last time the animation was updated
		this.flip = 1
		this.imageOffsety = 4
		this.scale = profile.scale || 1

		this.timer = 0

		// Expressions
		this.bubbleText = false // string, show speech bubble over character
		this.bubbleTextWrapped = false // List of strings; represents each line of the speech bubble text
		this.bubbleTime = false // How long the bubble is visible (seconds)
		this.bubbleTimer = 0
	}

	// Move: direction normal x, direction normal y
	move(nx, ny) {
		if (this.static) {
			this.sx = 0
			this.sy = 0
			this.walking = false
			return false
		}

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

		// Face in the current direction
		this.anim.setFrame(null, dir_lookup[this.dir])
		// Update walking or emote animation
		this.anim.update(dt)

		// Dissapear chat bubble after few seconds
		if (this.bubbleText != false) {
			this.bubbleTimer += dt
			if (this.bubbleTimer > this.bubbleTime) {
				this.bubbleTime = false
				this.bubbleText = false
			}
		}

		this.timer += dt
		this.oldwalking = this.walking
	}

	// Render chicken with accessories with optional different position
	draw(drawX=this.x, drawY=this.y) {
		let dir = this.dir

		// Shadow
		DRAW.setColor(255,255,255,1.0)
		DRAW.image(IMG.shadow, null, drawX, drawY+this.imageOffsety +3, 0, this.scale, this.scale, 0.5, 1)

		// Chicken and accessories
		DRAW.setColor(this.color[0],this.color[1],this.color[2],1.0)
		DRAW.image(IMG.chicken, this.anim.getFrame(), drawX, drawY+this.imageOffsety, 0, this.flip*this.scale, this.scale, 0.5, 1)

		DRAW.setColor(255,255,255,1.0)
		if ((this.body != false) && (ITEMS.body[this.body] != null) && (ITEMS.body[this.body].sprite != null)) { // Body item
			// Figure out the center of the body item to place it on the center of the chicken's 'neck'
			let item = ITEMS.body[this.body]
			let x = drawX - (SPRITE.chicken.w/2)*this.flip*this.scale + (BODYOFFSET[dir_lookup[dir]][this.anim.framex][0])*this.flip*this.scale
			let y = drawY+this.imageOffsety - SPRITE.chicken.h*this.scale + BODYOFFSET[dir_lookup[dir]][this.anim.framex][1]*this.scale
			let centerX = item.center[dir_lookup[dir]][0]/item.sprite.w
			let centerY = item.center[dir_lookup[dir]][1]/item.sprite.h
			DRAW.image(item.image, item.sprite.getFrame(0, dir_lookup[dir]), x, y, CHICKENROTATION[this.anim.framex], this.flip*this.scale, this.scale, centerX, centerY)
		}

		DRAW.image(IMG.chicken, this.anim.getFrame(null, 3), drawX, drawY+this.imageOffsety, 0, this.flip*this.scale, this.scale, 0.5, 1) // Uncolored sprite
		
		if ((this.face != false) && (ITEMS.face[this.face] != null) && (ITEMS.face[this.face].sprite != null)) { // Face item
			// Figure out the center of the face item to place it on the center of the chicken's face
			let item = ITEMS.face[this.face]
			let x = drawX - (SPRITE.chicken.w/2)*this.flip*this.scale + (FACEOFFSET[dir_lookup[dir]][this.anim.framex][0])*this.flip*this.scale
			let y = drawY+this.imageOffsety - SPRITE.chicken.h*this.scale + FACEOFFSET[dir_lookup[dir]][this.anim.framex][1]*this.scale
			let centerX = item.center[dir_lookup[dir]][0]/item.sprite.w
			let centerY = item.center[dir_lookup[dir]][1]/item.sprite.h
			DRAW.image(item.image, item.sprite.getFrame(0, dir_lookup[dir]), x, y, CHICKENROTATION[this.anim.framex], this.flip*this.scale, this.scale, centerX, centerY)
		}

		if ((this.head != false) && (ITEMS.head[this.head] != null) && (ITEMS.head[this.head].sprite != null)) { // Head item
			// Figure out the center of the head item to place it on the center of the chicken's head
			let item = ITEMS.head[this.head]
			let x = drawX - (SPRITE.chicken.w/2)*this.flip*this.scale + (HEADOFFSET[dir_lookup[dir]][this.anim.framex][0])*this.flip*this.scale
			let y = drawY+this.imageOffsety - SPRITE.chicken.h*this.scale + HEADOFFSET[dir_lookup[dir]][this.anim.framex][1]*this.scale
			let centerX = item.center[dir_lookup[dir]][0]/item.sprite.w
			let centerY = item.center[dir_lookup[dir]][1]/item.sprite.h
			DRAW.image(item.image, item.sprite.getFrame(0, dir_lookup[dir]), x, y, CHICKENROTATION[this.anim.framex], this.flip*this.scale, this.scale, centerX, centerY)
		}
	}

	drawOver() {
		// Nametag
		DRAW.setFont(FONT.nametag, 3)
		if (this.npc) {
			DRAW.setColor(180,180,180,1)
		} else {
			DRAW.setColor(255,255,255,1)
		}
		DRAW.text(this.name, Math.floor(this.x), Math.floor(this.y)-128*this.scale, "center")

		// Chat bubble
		if (this.bubbleText != false) {
			let offsetY = 140

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
		this.color = HEXtoRGB(profile.color) || [255,255,255]
		this.head = profile.head || false
		this.face = profile.face || false
		this.body = profile.body || false
		this.item = profile.item || false

		this.scale = profile.scale || 1
		//Send profile to server if this is the player
		if (sendToServer && this.controller == PLAYER_CONTROLLER) {
			NETPLAY.sendProfile(PROFILE)
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

			if (this == PLAYER) {
				NETPLAY.sendEmote(i)
			}
		}
	}

	// Collision
	collide(name, obj, nx, ny) {
		if (name == "Character" || name == "Trigger") {
			return false
		}
		return true
	}

	startCollide(name, obj) {
		// Handle player collisions
		if (this.controller && this.controller.startCollide) {
			this.controller.startCollide(name, obj)
		}
	}

	stopCollide(name, obj) {
		// Handle player collisions
		if (this.controller && this.controller.stopCollide) {
			this.controller.stopCollide(name, obj)
		}
	}
}