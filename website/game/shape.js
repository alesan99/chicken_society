// 'Shape' of a collision hitbox for a physics object

class Shape {
	//Initialize: points [x,y, x,y, x,y ...]
	constructor (points) {
		// List of vertices
		this.v = points

		// Bounding box; used to quickly figure out if two shapes could possibly be colliding
		this.bx = 0
		this.by = 0
		this.bw = 1
		this.bh = 1
		
		for (let i = 0; i <= this.v.length; i++) {
			// TODO: Get min max here
		}
	}
}
