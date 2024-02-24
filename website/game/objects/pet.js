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
		this.speed = 180
		this.area = owner.area

		// Status
		this.happiness = SAVEDATA.pet.happiness || 0.8
		this.health = SAVEDATA.pet.health || 1
		this.hunger = SAVEDATA.pet.hunger || 1
		this.disease = false

		this.dead = false

		// Movement
		this.walking = false

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
		if (this.owner != null && !this.dead) {
			// Target
			let tx = this.owner.x
			let ty = this.owner.y

			let dist = (tx-this.x)*(tx-this.x) + (ty-this.y)*(ty-this.y)
			if (dist > 4000) {
				let angle = Math.atan2(ty-this.y, tx-this.x)
				this.sx = Math.cos(angle)*this.speed
				this.sy = Math.sin(angle)*this.speed

				// Animation
				if (this.sx > 0) {
					this.flip = 1
				} else {
					this.flip = -1
				}

				if (!this.walking) {
					this.anim.playAnimation([1,2], 0.15)
					this.walking = true
				}

				this.activated = false // Temporary, moving will let you click on pet again
			} else {
				this.sx = 0
				this.sy = 0

				// Animation
				if (this.walking) {
					this.anim.stopAnimation(0, null)
					this.walking = false
				}
			}

			this.area = this.owner.area
		}

		// Click
		if (this.owner == PLAYER) {
			if ((this.activated == false) && this.checkMouseOver()) {
				this.mouseOver = true
				CURSOR.on = true
			} else {
				this.mouseOver = false
			}
		}

		// Update mood and life cycles
		if (this.dead) {
			
		} else {
			this.hunger = Math.max(0, this.hunger - 0.0004*dt)
			let starvingThreshold = 0.2
			if (this.hunger <= starvingThreshold) {
				let speed = 0.005*((starvingThreshold-this.hunger)/starvingThreshold)
				this.health = Math.max(0, this.health - speed*dt)
			}

			if (this.hunger < 0.75) {
				this.happiness = Math.max(0, this.happiness - 0.003*dt)
			}
			if (this.health < 0.5) {
				this.happiness = Math.max(0, this.happiness - 0.002*dt)
			}
			if (this.health > 0.85) {
				this.happiness = Math.min(1, this.happiness + 0.002*dt)
			}

			if (this.happiness < 0.5) {
				this.anim.setFrame(null, 1)
			}

			if (this.health <= 0) {
				this.anim.setFrame(3,0)
				this.dead = true
			}
		}

		// Update Animation
		this.anim.update(dt)
	}

	draw(drawX=this.x, drawY=this.y, dir=this.dir) {
		DRAW.setColor(255,255,255,1.0)
		DRAW.image(IMG.shadow, null, drawX, drawY, 0, this.scale, this.scale, 0.5, 1)

		// Pet graphic
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
			"heavenly",
			"jolly",
			"happy",
			"coy",
			"groovy",
			"just alright",
			"bored",
			"so-so",
			"meh",
			"emo",
			"sad",
			"depressed",
			"dorceless",
			"miserable"
		]
		let hungry_moods = [
			"hungry",
			"hangry",
			"absolutely famished",
		]
		let word = "mysterious"

		if (this.dead) {
			word = "dead"
		} else {
			// Feeling whatever happiness is
			word = moods[((1-this.happiness)*(moods.length-1))|0]
		}
		return word
	}
}