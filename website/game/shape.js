// 'Shape' of a collision hitbox for a physics object

class Shape {
	//Initialize: points [x,y, x,y, x,y ...]
	constructor (...points) {
		// List of vertices
		this.v = points
		this.vCount = this.v.length/2
		this.n = [] // side normals
		// Bounding box; used to quickly figure out if two shapes could possibly be colliding
		this.x1 = this.v[0] // Top left point
		this.y1 = this.v[1]
		this.x2 = this.v[0] // Bottom right point
		this.y2 = this.v[1]
		
		for (let i = 0; i < this.v.length; i+= 2) {
			// Find out minimum and maximum values for bounding box
			let [vx, vy] = [this.v[i], this.v[i+1]]
			this.x1 = Math.min(this.x1, vx)
			this.y1 = Math.min(this.y1, vy)
			this.x2 = Math.max(this.x2, vx)
			this.y2 = Math.max(this.y2, vy)

			// Calculate normals
			let side1 = i
			let side2 = ((side1+2)%this.v.length) // get next point (loop back around if last point)
			let [v1x, v1y] = [this.v[side1], this.v[side1+1]]
			let [v2x, v2y] = [this.v[side2], this.v[side2+1]]
			// Edge vector
			let [edgeX, edgeY] = [v2x-v1x, v2y-v1y]
			// Axis projection vector
			let [axisX, axisY] = vec2Unit(...vec2Norm(edgeX, edgeY))
			this.n.push(axisX, axisY) // add to list of normals
		}

		this.w = this.x2-this.x1
		this.h = this.y2-this.y1
	}
}
