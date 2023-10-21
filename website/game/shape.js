// 'Shape' of a collision hitbox for a physics object

class Shape {
	//Initialize: points [x,y, x,y, x,y ...]
	constructor (...points) {
		// List of vertices
		this.v = points
		// Bounding box; used to quickly figure out if two shapes could possibly be colliding
		this.x1 = 0 // Top left point
		this.y1 = 0
		this.x2 = 1 // Bottom right point
		this.y2 = 1
		
		for (let i = 0; i < this.v.length; i+= 2) { // Find out minimum and maximum values
			let [vx, vy] = [this.v[i], this.v[i+1]]
			this.x1 = Math.min(this.x1, vx)
			this.y1 = Math.min(this.y1, vy)
			this.x2 = Math.max(this.x2, vx)
			this.y2 = Math.max(this.y2, vy)
		}

		this.w = this.x2-this.x1
		this.h = this.y2-this.y1
	}
}
