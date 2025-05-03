// Collision & physics system

import { FONT } from "./assets.js";
import { vec2Dot } from "./lib/vec2.js";

// Update physics; (list of objects, deltaTime)
let listOfCollisions = new Map();
function updatePhysics(objs, spatialHash, dt) {
	for (const [objsName, objsList] of Object.entries(objs)) { // Look through list of object types
		if (!objsList.dontUpdate) { // Don't bother updating these objects (Will always be static, like walls)
			for (const [ia, a] of Object.entries(objsList)) { // Look at each object
				// Only update object if 'active' in physics space AND not static
				listOfCollisions.clear();
				a.DEBUGCOLLIDED = false;

				let oldx = a.x;
				let oldy = a.y;
				let nx = a.x;
				let ny = a.y;

				// Optional gravity
				if (a.gravity) {
					a.sy = a.sy + a.gravity*dt;
				}

				// New (possible) location
				if (!a.static) {
					nx = a.x + a.sx*dt;
					ny = a.y + a.sy*dt;
				}

				if (a.active && !a.static) { // Check for collisions?
					let collided = false;

					// Range covered by object and its movement
					let rx1 = a.shape.x1+Math.min(a.x, nx);
					let ry1 = a.shape.y1+Math.min(a.y, ny);
					let rx2 = a.shape.x2+Math.max(a.x, nx);
					let ry2 = a.shape.y2+Math.max(a.y, nx);

					// Loop through all objects in the range using Spatial hash
					for (const [ib, b] of spatialHash.retrieveCells(rx1,ry1, rx2,ry2).entries()) {
						if (b.active && (!b.DELETED)) {
							if (!(a == b)) { // Shouldn't collide with itself
								// Only check for collision if bounding boxes will overlap
								if (isAABBColliding(nx+a.shape.x1,ny+a.shape.y1,nx+a.shape.x2,ny+a.shape.y2,
									// Time to do polygonal collision check
									b.x+b.shape.x1,b.y+b.shape.y1,b.x+b.shape.x2,b.y+b.shape.y2)) {
									let [coll1, moveAxisX, moveAxisY, dist] = checkCollision(a, b, nx, ny);
									if (coll1) {
										// Objects are overlapping, if both collision callbacks return true then push
										let testColl1 = a.collide(b.constructor.name, b, moveAxisX, moveAxisY);
										let testColl2 = b.collide(a.constructor.name, a, -moveAxisX, -moveAxisY);
										if (testColl1 && testColl2) {
											a.DEBUGCOLLIDED = true;
											collided = true;
											// Push object A by changing its new position
											if (b.static) {
												nx += moveAxisX*dist;
												ny += moveAxisY*dist;
											} else {
												// Temporary fix, objects should both push eachother so looping order doesn't do weird things
												// TODO: Add mass so certain objects are more resistant to movement
												nx += moveAxisX*dist*0.5;
												ny += moveAxisY*dist*0.5;
												let bnx = b.x - moveAxisX*dist*0.5;
												let bny = b.y - moveAxisY*dist*0.5;
												b.setPosition(bnx, bny);
											}
											
										}
										// note down the collision to tell if its colliding for the first or last time
										if (a.collisions) {
											listOfCollisions.set(b,true);
											if (!a.collisions.has(b)) {
												a.collisions.set(b,true);
												let testColl1 = a.startCollide(b.constructor.name, b, moveAxisX, moveAxisY);
											}
											if (!b.collisions.has(a)) {
												b.collisions.set(a,true);
												let testColl2 = b.startCollide(a.constructor.name, a, -moveAxisX, -moveAxisY);
											}
										}
									}
								}
							}
						}
					}

					// Check when object are no longer colliding
					if (a.collisions) {
						for (const [b, coll] of a.collisions.entries()) {
							if (!(listOfCollisions.has(b)) && coll == true) {
								if (b) {
									let testColl1 = a.stopCollide(b.constructor.name, b);
									if (b.collisions.get(a)) {
										let testColl2 = b.stopCollide(a.constructor.name, a);
										b.collisions.delete(a);
									}
								}
								a.collisions.delete(b);
							}
						}
					}
				}

				// Ignore calculated position if collision callback changed it
				if (a.x != oldx) {
					nx = a.x;
				}
				if (a.y != oldy) {
					ny = a.y;
				}

				// Finally move to 'new' position
				if (!(a.x == nx && a.y == ny)) {
					a.setPosition(nx, ny);
				}
			}
		}
	}
}

function isAABBColliding(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
	return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
}

// Check collision between two PhysicsObjects; Object A, Object B, Future Object A x, Future Object A y
function checkCollision(a, b, fax, fay) {
	// Seperating Axis Theorem

	// Moving Object A is colliding with Object B
	let [shapeA, pointsA, pointCountA, normalsA] = [a.shape, a.shape.v, a.shape.vCount, a.shape.n];
	let [shapeB, pointsB, pointCountB, normalsB] = [b.shape, b.shape.v, b.shape.vCount, b.shape.n];
	let overlap = Number.POSITIVE_INFINITY; // find minimum overlap; magnitude of the push vector
	let [minAxis, axisIntersectionMin, moveAxisX,moveAxisY] = [0,0, 0,0]; // Push vector

	for (let side = 0; side < pointCountB+pointCountA; side++) { // Loop through the sides of object B & object A
		// Find which axis to use
		// axis is stored as a direction normal
		let [x, y] = [0,0]; // World space coordinate of first point of the side
		let [axisX, axisY] = [0,0]; // Normal of side
		if (side < pointCountB) {
			// sides of polygon B
			let vi = side*2; // vertex index
			x = pointsB[vi]+b.x;
			y = pointsB[vi+1]+b.y;
			axisX = normalsB[vi];
			axisY = normalsB[vi+1];
		} else {
			// sides of polygon A
			let vi = (side-pointCountB)*2; // vertex index
			x = pointsA[vi]+fax;
			y = pointsA[vi+1]+fay;
			axisX = normalsA[vi];
			axisY = normalsA[vi+1];
		}

		// Go through every vertex and 'flatten' them onto the axis
		// Object B
		let min1 = vec2Dot(axisX,axisY, pointsB[0]+b.x,pointsB[1]+b.y); // Project first point onto axis
		let max1 = min1;
		for (let vert = 1; vert < pointCountB; vert++) { // project rest of the points
			let proj = vec2Dot(axisX,axisY, pointsB[vert*2]+b.x,pointsB[vert*2+1]+b.y);
			min1 = Math.min(min1, proj);
			max1 = Math.max(max1, proj);
		}
		// Object A
		let min2 = vec2Dot(axisX,axisY, pointsA[0]+fax,pointsA[1]+fay); // Project first point onto axis
		let max2 = min2;
		for (let vert = 1; vert < pointCountA; vert++) { // project rest of the points
			let proj = vec2Dot(axisX,axisY, pointsA[vert*2]+fax,pointsA[vert*2+1]+fay);
			min2 = Math.min(min2, proj);
			max2 = Math.max(max2, proj);
		}
		
		// Check for no overlap between Object B & Object A
		// In SAT, all there must be an overlap on ALL axes, so no overlap in this one axis means there is no collision
		if (!(max2 >= min1 && max1 >= min2)) {
			return [false, 0,0,0];
		}
		
		// else, get overlap (and record axis if minimum)
		// multiple axes probably have the exact same overlap so lets try to find the one with the closest distance
		let displacementFromOrigin = -vec2Dot(axisX,axisY, x,y);
		let intersectionMin = Math.max(min1,min2) + displacementFromOrigin;
		let insersectionMax = Math.min(max1,max2) + displacementFromOrigin;

		let o = Math.min(max1,max2) - Math.max(min1,min2);
		// use the axis with the least overlap
		// if they have the same overlap, check which intersection has the closest distance to the origin
		if ((o < overlap - 0.0001) || (Math.abs(o - overlap) < 0.0001 && Math.abs(intersectionMin) < Math.abs(axisIntersectionMin))) {
			overlap = o;
			minAxis = side;
			axisIntersectionMin = intersectionMin;
			if (minAxis < pointCountB) { //belongs to polygon B
				[moveAxisX,moveAxisY] = [axisX,axisY];
			} else { //belongs to polygon A
				[moveAxisX,moveAxisY] = [-axisX,-axisY];
			}
		}
	}

	return [true, moveAxisX, moveAxisY, overlap];
}

// Spatial Hash functions; A grid that is used to find nearby objects without iterating through every single object
// The Hash is a 2D array with a list as each element. This list is a 'cell' and a cell contains every object in that space.
class SpatialHash {
	constructor (ww, wh, cs) {
		// Create hash map
		this.worldw = ww;  // Size of world in pixels
		this.worldh = wh;
		this.cellSize = cs;
		this.cw = Math.ceil(ww/this.cellSize); // Number of cells horizontally -1
		this.ch = Math.ceil(wh/this.cellSize); // Number of cells vertically -1
	
		this.hash = [];
		for (let x = 0; x <= this.cw; x++) {
			this.hash[x] = [];
			for (let y = 0; y <= this.ch; y++) {
				this.hash[x][y] = new Map();
			}
		}

		this.objAppearedMap = new Map(); // Reusable map to keep track of objects in the retrieve function
	}

	clear() {
		for (let x = 0; x <= this.cw; x++) {
			for (let y = 0; y <= this.ch; y++) {
				this.hash[x][y].clear();
			}
		}
	}

	// Given world corrdinates find which cell range the object is in
	getCoords(x1, y1, x2, y2) {
		let cx1 = Math.floor(Math.min(Math.max(x1, 0), this.worldw)/this.cellSize);
		let cy1 = Math.floor(Math.min(Math.max(y1, 0), this.worldh)/this.cellSize);
		let cx2 = Math.floor(Math.min(Math.max(x2, 0), this.worldw)/this.cellSize);
		let cy2 = Math.floor(Math.min(Math.max(y2, 0), this.worldh)/this.cellSize);
		return [cx1, cy1, cx2, cy2];
	}

	getCell(cx, cy) {
		return this.hash[cx][cy];
	}

	putToCell(cx, cy, obj) {
		this.hash[cx][cy].set(obj, obj);// Store the object in the hash by directly using obj as the key
	}
	removeFromCell(cx, cy, obj) {
		this.hash[cx][cy].delete(obj);
	}

	// Compiles all objects in a range of cells into a list
	retrieveCells(x1, y1, x2, y2) {
		this.objAppearedMap.clear();
		let [cx1, cy1, cx2, cy2] = this.getCoords(x1, y1, x2, y2);
		// Loop through range of cells
		for (let x = cx1; x <= cx2; x++) {
			for (let y = cy1; y <= cy2; y++) {
				// Add objects to object list without duplicates
				let cell = this.getCell(x, y);
				for (const [obji, obj] of cell.entries()) {
					this.objAppearedMap.set(obj, obj);
				}
			}
		}
		return this.objAppearedMap;
	}
}

// Debug draw all hitboxes
function drawPhysics(Draw, objs, spatialHash, offsetX=0, offsetY=0) {
	// Draw Spatial Hash
	Draw.setColor(0,0,0,0.5);
	Draw.setFont(FONT.caption);
	Draw.setLineWidth(1);
	for (let x = 0; x <= spatialHash.cw; x++) {
		for (let y = 0; y <= spatialHash.ch; y++) {
			let cellSize = spatialHash.cellSize;
			Draw.polygon([x*cellSize+offsetX,y*cellSize+offsetY, x*cellSize+cellSize+offsetX,y*cellSize+offsetY, x*cellSize+cellSize+offsetX,y*cellSize+cellSize+offsetY, x*cellSize+offsetX,y*cellSize+cellSize+offsetY], "line")
			Draw.text(spatialHash.getCell(x, y).size,x*cellSize+cellSize/2+offsetX,y*cellSize+cellSize/2+offsetY);
		}
	}
	// Draw hitboxes
	for (const [name, objsList] of Object.entries(objs)) { // Look through list of object types
		for (const [i, a] of Object.entries(objsList)) { // Look at each object
			if (typeof a === "object") {
				Draw.push();
				Draw.translate(a.x+offsetX, a.y+offsetY);
	
				// Draw object's shape and bounding box
				Draw.setColor(0,0,80,1.0);
				if (a.DEBUGCOLLIDED == true) { // Turn red if currently colliding
					Draw.setColor(255,0,0,1.0);
				}
				Draw.setLineWidth(1);
				Draw.rectangle(a.shape.x1, a.shape.y1, a.shape.w, a.shape.h, "line");
				Draw.setLineWidth(2);
				Draw.polygon(a.shape.v, "line");
	
				Draw.circle(0, 0, 3, "fill"); // Object center (Shape's origin)
	
				Draw.pop();
			}
		}
	}
}

export { updatePhysics, SpatialHash, drawPhysics };