//Wall, collides with other objects to stop them

import PhysicsObject from "./object.js"
import Shape from "../shape.js"

export default class Wall extends PhysicsObject {
	//Initialize: list of points
	constructor (spatialHash,...points) {
		// Collision
		super(spatialHash,0,0)
		this.x = 0
		this.y = 0

		this.shape = new Shape(...points)

		this.active = true
		this.static = true
		this.setPosition(null,null)
	}
}