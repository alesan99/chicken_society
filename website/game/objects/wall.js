//Wall, collides with other objects to stop them

import Shape from "../shape.js";
import {PhysicsObject} from "./objects.js";

export default class Wall extends PhysicsObject {
	//Initialize: list of points
	constructor (spatialHash,...points) {
		// Collision
		super(spatialHash,0,0);
		this.x = 0;
		this.y = 0;

		this.shape = new Shape(...points);

		this.active = true;
		this.static = true;
		this.setPosition(null,null);
	}
}