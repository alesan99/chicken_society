//Walls, collides with other objects to stop them

class Walls extends PhysicsObject {
	//Initialize: x pos, y pos, width, height
	constructor (config) {
		super(0,0,0,0)
		this.config = config // configuration string
		this.polys = [] //list of polygons
	}

	//Check if object is inside walls
	checkInside(obj) {
		//TODO: Use seperated axis theorem to find collisions.
	}
}