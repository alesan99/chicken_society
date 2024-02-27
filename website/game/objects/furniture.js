//Furniture

class Furniture extends PhysicsObject {
	//Initialize: list of points
	constructor (spatialHash, item) {
		// Collision
		super(spatialHash,0,0)
		this.x = 0
		this.y = 0

		this.item = item
		this.shape = new Shape(...item.shape)

		this.image = item.image
		this.sprite = item.sprite

		this.active = true
		this.static = true
		this.setPosition(null,null)
	}

	draw() {
		DRAW.setColor(255,255,255,1.0)
		DRAW.draw(this.image, this.sprite.getFrame(0,0), this.x, this.y)
	}
}