//Trigger; Whenever the player is over this area, it can activate an action like a dialogue or a quest progression

class Trigger extends PhysicsObject {
	//Initialize: x pos, y pos, shape in points
	constructor (spatialHash, x, y, action, points, clickRegion) {
		// Collision
		super(spatialHash,x,y)
		this.x = x || 0
		this.y = y || 0

		this.shape = new Shape(...points)

        this.action = action

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
			let [mouseX, mouseY] = getMousePos()
	
			let cr = this.clickRegion
			if (mouseX-this.x > cr.x && mouseY-this.y > cr.y && mouseX-this.x < cr.x+cr.w && mouseY-this.y < cr.y+cr.h) {
				this.mouseOver = true
			} else {
				this.mouseOver = false
			}
		}
	}

    doAction() {
        this.action()
    }
    
	// Collision
	collide(name, obj, nx, ny) {
		return false
	}

    startCollide(name, obj, nx, ny) {
		if (name == "Character" && obj == PLAYER) {
            this.doAction()
		}
	}

    stopCollide(name, obj) {

    }

	click(button, x, y) {
		console.log("Clikc!", this.clickRegion, this.mouseOver)
		if (this.clickRegion && this.mouseOver) {
			this.doAction()
			return true
		}
	}
}