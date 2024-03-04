//Trigger; Whenever the player is over this area, it can activate an action like a speechBubble or a quest progression

class Trigger extends PhysicsObject {
	//Initialize: x pos, y pos, shape in points
	constructor (spatialHash, x, y, shape, action, clickable=false, icon=false) {
		// Collision
		super(spatialHash,x,y)
		this.x = x || 0
		this.y = y || 0

		this.shape = new Shape(...shape)

        this.action = action

		this.actionReady = false // is the trigger ready to be activated (Ex: player is near trigger)
		this.activated = false

		this.actionIconFrame = false
		if (icon) {
			this.actionIconFrame = icon.frame
			this.actionIconX = icon.x
			this.actionIconY = icon.y
		}
		this.actionIconText = icon.text || ""
		this.displayIcon = false

		this.active = true
		this.static = true
		this.setPosition(null,null)

		this.clickable = (clickable != null)
		if (clickable) {
			this.mouseOver = false
			if (Array.isArray(clickable)) { // Clickable is an array of points
				// [x1,y1, x2,y2, x3,y3..]; a clickable region that activates this trigger
				this.clickShape = new Shape(...clickable)
			} else { // Clickable is boolean
				this.clickShape = this.shape
			}
		}
	}

	update(dt) {
		if (!this.active) {
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
		if (!this.activated) {
			this.activated = true
			this.action()
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
		if (name == "Character" && obj == PLAYER) {
			this.actionReady = true
            // this.doAction()
		}
	}

    stopCollide(name, obj) {
		if (name == "Character" && obj == PLAYER) {
			this.actionReady = false
			this.activated = false
		}
    }

	click(button, x, y) {
		if (this.clickable && ((this.activated == false) && this.checkMouseOver())) {
			this.doAction()
			return true
		}
	}
}