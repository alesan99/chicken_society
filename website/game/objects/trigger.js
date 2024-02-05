//Trigger; Whenever the player is over this area, it can activate an action like a dialogue or a quest progression

class Trigger extends PhysicsObject {
	//Initialize: x pos, y pos, shape in points
	constructor (spatialHash, x, y, action, points, icon={frame:1,x:0,y:0}, clickRegion) {
		// Collision
		super(spatialHash,x,y)
		this.x = x || 0
		this.y = y || 0

		this.shape = new Shape(...points)

        this.action = action

		this.actionReady = false // is the trigger ready to be activated (Ex: player is near trigger)
		this.activated = false

		this.actionIconFrame = icon.frame
		this.actionIconX = icon.x
		this.actionIconY = icon.y
		this.actionIconText = icon.text || ""
		this.displayIcon = false

		this.active = true
		this.static = true
		this.setPosition(null,null)

		if (clickRegion) {
			// [x, y, w, h]; a clickable region that activates this trigger
			this.clickRegion = {
				x: clickRegion[0],
				y: clickRegion[1],
				w: clickRegion[2],
				h: clickRegion[3]
			}
			this.mouseOver = false
		}
	}

	update(dt) {
		// Is mouse inside clickable region?
		if (this.clickRegion) {
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
		let cr = this.clickRegion
		return (mouseX-this.x > cr.x && mouseY-this.y > cr.y && mouseX-this.x < cr.x+cr.w && mouseY-this.y < cr.y+cr.h)
	}

	draw() {
		// Show an icon if trigger is ready to be activated
		if ((this.actionReady || this.mouseOver) && this.activated == false) {
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
			this.action()
			this.activated = true
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
		if (this.clickRegion && ((this.activated == false) && this.checkMouseOver())) {
			this.doAction()
			return true
		}
	}
}