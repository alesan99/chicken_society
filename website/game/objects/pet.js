// Pet object; Follows player.

class Pet extends PhysicsObject {
	//Initialize: pet id (item id), x pos, y pos, 'owner' object to follow
	constructor (spatialHash, id, x, y, owner) {
		// Collision
		super(spatialHash,x,y)
		this.x = x
		this.y = y
		this.w = 20
		this.h = 20

		this.shape = new Shape(
			-this.w/2, -this.h/2,
			this.w/2, -this.h/2,
			this.w/2, this.h/2,
			-this.w/2, this.h/2
		)

		this.sx = 0
		this.sy = 0

		// Pet data
		this.id = id
		this.owner = owner

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
			} else {
				this.sx = 0
				this.sy = 0
			}
		}
	}

    draw(drawX=this.x, drawY=this.y, dir=this.dir) {
		DRAW.setColor(255,255,255,1.0)
		DRAW.image(IMG.shadow, null, drawX, drawY, 0, this.scale, this.scale, 0.5, 1)

		// Chicken and accessories
		DRAW.setColor(255,255,255,1.0)
		DRAW.image(this.image, this.anim.getFrame(), drawX, drawY, 0, this.flip*this.scale, this.scale, 0.5, 1)
    }

	collide (name, obj, nx, ny) {
		return false
	}

	startCollide (name, obj, nx, ny) {
	}
}