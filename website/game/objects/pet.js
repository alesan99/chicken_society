// Pet object; Follows player.

class Pet extends PhysicsObject {
	//Initialize: x pos, y pos, width, height
	constructor (spatialHash, x, y, id) {
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