//Furniture

class Furniture extends PhysicsObject {
	//Initialize: list of points
	constructor (spatialHash, itemId, x=0, y=0, dir="down") {
		// Collision
		super(spatialHash,0,0)
		this.x = x
		this.y = y
		this.dir = dir

		let item = getItemData(itemId)
		this.item = item
		this.id = itemId
		this.shape = new Shape(...item.shape)

		this.center = item.center

		this.image = item.image
		this.sprite = item.sprite

		this.colliding = 0

		this.active = true
		this.static = true
		this.setPosition(null,null)
	}

	update(dt) {
	}

	draw() {
		// Furniture itself
		let dir_lookup = {up: 2, down: 0, left: 1, right: 1}
		let flip = 1
		if (this.dir == "left") {
			flip = -1
		}
		DRAW.setColor(255,255,255,1.0)
		DRAW.image(this.image, this.sprite.getFrame(0,dir_lookup[this.dir]), this.x, this.y, 0, flip, 1.0, this.center[dir_lookup[this.dir]][0]/this.sprite.w, this.center[dir_lookup[this.dir]][1]/this.sprite.h)

		// Draw footprint when moving
		if (!this.static) {
			DRAW.push()
			DRAW.translate(this.x, this.y)
			if (this.colliding > 0) {
				DRAW.setColor(195,0,0,0.25)
			} else {
				DRAW.setColor(10,50,195,0.25)
			}
			DRAW.polygon(this.shape.v, "fill")
			DRAW.pop()
		}
	}

	setDir(dir="down") {
		this.dir = dir
		let dir_lookup = {up: 2, down: 0, left: 1, right: 1}
		let flip = 1
		if (this.dir == "left") {
			flip = -1
		}
		// set Shape if there are multiple shapes for each direction
		// this.shape = new Shape(...this.item.shape[dir_lookup[dir]])
	}

	// Collision
	collide(name, obj, nx, ny) {
		if (this.static) {
			return true
		} else {
			return false // Can collide, but don't move furniture (while placing)
		}
	}

	startCollide(name, obj) {
		this.colliding += 1
	}

	stopCollide(name, obj) {
		this.colliding -= 1
	}
}