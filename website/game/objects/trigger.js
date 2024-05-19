//Trigger; Whenever the player is over this area, it can activate an action like a speechBubble or a quest progression

class Trigger extends PhysicsObject {
	//Initialize: x pos, y pos, shape in points, action func, activate when clicked?, icon: {frame, x, y}, activate when walked over?
	constructor (spatialHash, x, y, shape, action, clickable=false, icon=false, walkOver=false, activateOnce=false, sound=false) {
		// Collision
		super(spatialHash,x,y)
		this.x = x || 0
		this.y = y || 0

		this.shape = new Shape(...shape)

				this.action = action

		this.actionReady = false // is the trigger ready to be activated (Ex: player is near trigger)
		this.activated = false

		// Icon that appear when trigger can be activated (when standing on it or mouse over it)
		this.actionIconFrame = false
		if (icon) {
			if (icon === true) { // default icon requested
				icon = {frame: 1, x: (this.shape.x2-this.shape.x1)/2, y: 0}
			}
			this.actionIconFrame = icon.frame
			this.actionIconX = icon.x
			this.actionIconY = icon.y
		}
		this.actionIconText = icon.text || ""
		this.displayIcon = false

		this.active = true
		this.static = true
		this.setPosition(null,null)

		// Activate on click
		this.clickable = (clickable != false)
		if (clickable) {
			this.mouseOver = false
			if (Array.isArray(clickable)) { // Clickable is an array of points
				// [x1,y1, x2,y2, x3,y3..]; a clickable region that activates this trigger
				this.clickShape = new Shape(...clickable)
			} else { // Clickable is boolean
				this.clickShape = this.shape
			}
		}
		// Activate when walked over
		this.walkOver = walkOver
		// Activate once until player goes to different area
		this.activateOnce = activateOnce
		this.activatedOnce = false
		// Sound
		this.sound = sound
		// Particle
		this.particle = true

		// Is active according to conditions?
		this.isActive = true
	}

	update(dt) {
		if (!this.active) {
			return
		}
		// Do not interact with triggers if a menu is open
		if (getOpenMenu() || DialogueSystem.getOpen()) {
			return
		}
		// Is mouse inside clickable region?
		if (this.clickable) {
			if ((this.activated == false) && this.checkMouseOver()) {
				this.mouseOver = true
				CURSOR.on = true
			} else {
				this.mouseOver = false
			}
		}
	}

	checkMouseOver() {
		let [mouseX, mouseY] = getMousePos()
		return this.clickShape.checkInside(mouseX-this.x, mouseY-this.y)
	}

	draw() {
		if (!this.active) {
			return
		}
		// Show an icon if trigger is ready to be activated
		if ((this.actionIconFrame !== false) && ((this.actionReady || this.mouseOver) && this.activated == false)) {
			DRAW.setColor(255,255,255,1.0)
			DRAW.image(IMG.action, SPRITE.action.getFrame(0,this.actionIconFrame), this.x+this.actionIconX, this.y+this.actionIconY, 0, 1,1, 0.5,1)
			// Frame #2 is for spending nuggets, so display nugget cost
			if (this.actionIconFrame == 2) {
				DRAW.setFont(FONT.caption)
				DRAW.setColor(0,0,0,1.0)
				DRAW.text(this.actionIconText, this.x+this.actionIconX+18, this.y+this.actionIconY-22, "center")
			}
		}
		this.displayIcon = (this.actionReady || this.mouseOver)
	}

	// Do action function if trigger hasn't been activated yet
	doAction() {
		if (!this.active) {
			return
		}
		if (this.activateOnce && this.activatedOnce) {
			return false // Don't activate again with activateOnce
		}
		if (!this.activated) {
			// Activate trigger
			this.activated = true
			this.action()

			if (this.sound) {
				AudioSystem.playSound(SFX[this.sound])
			}
			if (this.particle && !this.active) {
				PARTICLES.push(new Particle(this.x+(this.shape.x2-this.shape.x1)/2, this.y+(this.shape.y2-this.shape.y1)/2, IMG.particle, SPRITE.dust, [0,1], 0.1))
			}
			return true
		}
	}

	reset() {
		// Act as if the trigger hasn't been activated
		this.activated = false
	}
		
	// Collision
	collide(name, obj, nx, ny) {
		return false
	}

	startCollide(name, obj, nx, ny) {
		if (!this.active) {
			return
		}
		if (name == "Character" && obj == PLAYER) {
			if (this.walkOver) {
				// Activate action immediately if walkOver is true
				this.actionReady = true
				this.doAction()
				this.activatedOnce = true
			} else {
				// Otherwise, wait for input
				this.actionReady = true
			}
		}
	}

	stopCollide(name, obj) {
		if (!this.active) {
			return
		}
		if (name == "Character" && obj == PLAYER) {
			this.actionReady = false

			// Reset trigger to activate again
			if (!this.activateOnce) {
				this.reset()
			}
		}
	}

	click(button, x, y) {
		if (!this.active) {
			return
		}
		if (this.clickable && ((this.activated == false) && this.checkMouseOver())) {
			this.doAction()
			this.mouseOver = false
			return true
		}
	}
}