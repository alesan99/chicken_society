// Pet object; Follows player.

class Pet extends PhysicsObject {
	//Initialize: pet id (item id), x pos, y pos, 'owner' object to follow
	constructor (spatialHash, id, x, y, owner) {
		// Collision
		super(spatialHash,x,y)
		this.x = x
		this.y = y
		this.w = 40
		this.h = 30

		this.shape = new Shape(
			-this.w/2, -this.h,
			this.w/2, -this.h,
			this.w/2, 0,
			-this.w/2, 0
		)

		this.sx = 0
		this.sy = 0

		// Pet data
		this.id = id
		this.name = SAVEDATA.pet.name
		this.owner = owner

		// Status
		this.happiness = SAVEDATA.pet.health || 50
		this.health = SAVEDATA.pet.health || 100
		this.hunger = SAVEDATA.pet.hunger || 100

		// Clickable
		this.mouseOver = false
		this.clickRegion = {
			x: -this.w/2,
			y: -this.h,
			w: this.w,
			h: this.h
		}
		this.activated = false

		// Graphics
		this.image = ITEMS.pet[id].image
		this.sprite = ITEMS.pet[id].sprite
		this.anim = new Animation(this.sprite, 0)
		this.anim.setFrame(0,0)

		this.flip = 1
		this.scale = 1

		this.active = false
		this.static = false
		this.setPosition(null,null)
	}

	update(dt) {
		// Follow behind owner
		if (this.owner != null) {
			// Target
			let tx = this.owner.x
			let ty = this.owner.y

			let dist = (tx-this.x)*(tx-this.x) + (ty-this.y)*(ty-this.y)
			if (dist > 4000) {
				let angle = Math.atan2(ty-this.y, tx-this.x)
				this.sx = Math.cos(angle)*200
				this.sy = Math.sin(angle)*200
				this.activated = false // Temporary, moving will let you click on pet again
			} else {
				this.sx = 0
				this.sy = 0
			}
		}

		// Click
		if ((this.activated == false) && this.checkMouseOver()) {
			this.mouseOver = true
			CURSOR.on = true
		} else {
			this.mouseOver = false
		}
	}

	draw(drawX=this.x, drawY=this.y, dir=this.dir) {
		DRAW.setColor(255,255,255,1.0)
		DRAW.image(IMG.shadow, null, drawX, drawY, 0, this.scale, this.scale, 0.5, 1)

		// Chicken and accessories
		DRAW.setColor(255,255,255,1.0)
		DRAW.image(this.image, this.anim.getFrame(), drawX, drawY, 0, this.flip*this.scale, this.scale, 0.5, 1)
	}

	checkMouseOver() {
		let [mouseX, mouseY] = getMousePos()
		let cr = this.clickRegion
		return (mouseX-this.x > cr.x && mouseY-this.y > cr.y && mouseX-this.x < cr.x+cr.w && mouseY-this.y < cr.y+cr.h)
	}

	click(button, x, y) {
		if (button == 0 && this.mouseOver) {
			// Open pet menu
			openMenu("petMenu")
			this.activated = true
			return true
		}
		return false
	}

	collide (name, obj, nx, ny) {
		return false
	}

	startCollide (name, obj, nx, ny) {
	}

	// Pet behavior
	getMood() {
		let moods = [
			"jolly",
			"happy",
			"groovy",
			"bored",
			"so-so",
			"meh",
			"emo",
			"sad",
			"dorceless",
		]
		let word = moods[((1-this.happiness/100)*(moods.length-1))|0]
		return word
	}
}