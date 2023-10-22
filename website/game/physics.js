// Collision & physics system

// Update physics; (list of objects, deltaTime)
function updatePhysics(objs, dt) {
	for (const [_, objsList] of Object.entries(objs)) { // Look through list of object types
		for (const [ia, a] of Object.entries(objsList)) { // Look at each object
			// Only update object if 'active' in physics space AND not static
			a.DEBUGCOLLIDED = false
			if (a.active && !a.static) {
				// New (possible) location
				let nx = a.x + a.sx*dt
				let ny = a.y + a.sy*dt

				let collided = false

				// Range covered by object and it's movement
				let rx1 = a.shape.x1+Math.min(a.x, nx)
				let ry1 = a.shape.y1+Math.min(a.y, ny)
				let rx2 = a.shape.x2+Math.max(a.x, nx)
				let ry2 = a.shape.y2+Math.max(a.y, nx)

				// Loop through all objects in the range using Spatial hash
				for (const [ib, b] of retrieveSpatialCells(rx1,ry1, rx2,ry2).entries()) {
					// TODO: Check collision
					if (b.active) {
						if (!(a == b)) { // Shouldn't collide with itself
							// Only check for collision if bounding boxes will overlap
							if (isAABBColliding(nx+a.shape.x1,ny+a.shape.y1,nx+a.shape.x2,ny+a.shape.y2,
								b.x+b.shape.x1,b.y+b.shape.y1,b.x+b.shape.x2,b.y+b.shape.y2)) {
								let [coll1, moveAxisX, moveAxisY, dist] = checkCollision(a, b, nx, ny)
								let [coll2] = checkCollision(a, b, a.x, a.y) // Unneccessary, remove to improve performance. This is just here to stop players from getting stuck ontop of eachother
								if (coll1) {
									a.DEBUGCOLLIDED = true
									collided = true
									// Push object A
									nx += moveAxisX*dist
									ny += moveAxisY*dist
								}
							}

							// Temporary axis-alligned bounding box collision; only counts as a collision if
							// 1. The two objects (A & B) are not currently colliding
							// 2. If object A WILL collide with object B after moving
							/**
							if (!isAABBColliding(a.x+a.shape.x1,a.y+a.shape.y1,a.x+a.shape.x2,a.y+a.shape.y2,
								b.x+b.shape.x1,b.y+b.shape.y1,b.x+b.shape.x2,b.y+b.shape.y2)
								&& isAABBColliding(nx+a.shape.x1,ny+a.shape.y1,nx+a.shape.x2,ny+a.shape.y2,
								b.x+b.shape.x1,b.y+b.shape.y1,b.x+b.shape.x2,b.y+b.shape.y2)) {
								collided = true
							}
							*/
						}
					}
				}

				// only move if it didn't collide with anything
				//if (collided == false) {
					a.setPosition(nx, ny)
				//}
			}
		}
	}
}

function isAABBColliding(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
	return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1
}

// Check collision between two PhysicsObjects; Object A, Object B, Future Object A x, Future Object A y
function checkCollision(a, b, fax, fay) {
	// Seperating Axis Theorem

	// Moving Object A is colliding with Object B
	let [shapeA, pointsA, pointCountA, normalsA] = [a.shape, a.shape.v, a.shape.vCount, a.shape.n]
	let [shapeB, pointsB, pointCountB, normalsB] = [b.shape, b.shape.v, b.shape.vCount, b.shape.n]
	let overlap = Number.POSITIVE_INFINITY // find minimum overlap; magnitude of the push vector
	let [minAxis, axisIntersectionMin, moveAxisX,moveAxisY] = [0,0, 0,0] // Push vector

	for (let side = 0; side < pointCountB+pointCountA; side++) { // Loop through the sides of object B & object A
		// Find which axis to use
		// axis is stored as a direction normal
		let [x, y] = [0,0] // World space coordinate of first point of the side
		let [axisX, axisY] = [0,0] // Normal of side
		if (side < pointCountB) {
			// sides of polygon B
			let vi = side*2 // vertex index
			x = pointsB[vi]+b.x
			y = pointsB[vi+1]+b.y
			axisX = normalsB[vi]
			axisY = normalsB[vi+1]
		} else {
			// sides of polygon A
			let vi = (side-pointCountB)*2 // vertex index
			x = pointsA[vi]+fax
			y = pointsA[vi+1]+fay
			axisX = normalsA[vi]
			axisY = normalsA[vi+1]
		}

		// Go through every vertex and 'flatten' them onto the axis
		// Object B
		let min1 = vec2Dot(axisX,axisY, pointsB[0]+b.x,pointsB[1]+b.y) // Project first point onto axis
		let max1 = min1
		for (let vert = 1; vert < pointCountB; vert++) { // project rest of the points
			let proj = vec2Dot(axisX,axisY, pointsB[vert*2]+b.x,pointsB[vert*2+1]+b.y)
			min1 = Math.min(min1, proj)
			max1 = Math.max(max1, proj)
		}
		// Object A
		let min2 = vec2Dot(axisX,axisY, pointsA[0]+fax,pointsA[1]+fay) // Project first point onto axis
		let max2 = min2
		for (let vert = 1; vert < pointCountA; vert++) { // project rest of the points
			let proj = vec2Dot(axisX,axisY, pointsA[vert*2]+fax,pointsA[vert*2+1]+fay)
			min2 = Math.min(min2, proj)
			max2 = Math.max(max2, proj)
		}
		
		// Check for no overlap between Object B & Object A
		// In SAT, all there must be an overlap on ALL axes, so no overlap in this one axis means there is no collision
		if (!(max2 >= min1 && max1 >= min2)) {
			return [false, 0,0,0]
			// return [minx, miny, maxx, maxy, setsxl, setsxr, setsyu, setsyd]
		}
		
		// else, get overlap (and record axis if minimum)
		// multiple axes probably have the exact same overlap so lets try to find the one with the closest distance
		let displacementFromOrigin = -vec2Dot(axisX,axisY, x,y)
		let intersectionMin = Math.max(min1,min2) + displacementFromOrigin
		let insersectionMax = Math.min(max1,max2) + displacementFromOrigin

		let o = Math.min(max1,max2) - Math.max(min1,min2)
		// use the axis with the least overlap
		// if they have the same overlap, check which intersection has the closest distance to the origin
		if ((o < overlap - 0.0001) || (Math.abs(o - overlap) < 0.0001 && Math.abs(intersectionMin) < Math.abs(axisIntersectionMin))) {
			
				overlap = o
				minAxis = side
				axisIntersectionMin = intersectionMin
				if (minAxis < pointCountB) { //belongs to polygon B
					[moveAxisX,moveAxisY] = [axisX,axisY]
				} else { //belongs to polygon A
					[moveAxisX,moveAxisY] = [-axisX,-axisY]
				}
		}
	}

	//resolve collision
	/**
	if (minAxis) {
		let upFacing = dot(0,-1, moveAxisX,moveAxisY)
		if (sx != 0 && math.abs(moveAxisX) > 0.0001) {
			// TODO: Slide on steep slopes
			if (moveAxisX < 0) {
				maxx = math.min(maxx, fx+moveAxisX*overlap)
				collided = true
				if (Math.abs(upFacing) < 0.0001) { //is it a vertical wall?
					setsxr = 0 // comment out to mitigate false collisions
					b:collide("right", c,d)
				}
			} else if (moveAxisX > 0) {
				minx = math.max(minx, fx+moveAxisX*overlap)
				collided = true
				if (Math.abs(upFacing) < 0.0001) { //is it a vertical wall?
					setsxl = 0 // comment out to mitigate false collisions
					b:collide("left", c,d)
				}
			}
		}
		//if (math.abs(moveAxisY) > 0.0001 && !(upFacing == 1 and minAxis <= shape.pointCount) {
			if (moveAxisY < 0) {
				maxy = math.min(maxy, fy+moveAxisY*overlap)
				setsyd = 0
				collided = true
				b:collide("down", c,d)
				b.groundNormalX = moveAxisX
				b.groundNormalY = moveAxisY
	 		} else if (moveAxisY > 0) {
				if (upFacing == -1) {
					miny = math.max(miny, fy+moveAxisY*overlap)
				}
				setsyu = 0
				collided = true
				b:collide("up", c,d)
			}
		//}
		b.moveAxisX = moveAxisX
		b.moveAxisY = moveAxisY
		b.minAxis = minAxis

		d.collided = true
	} */
	return [true, moveAxisX, moveAxisY, overlap]
	//return [minx, miny, maxx, maxy, setsxl, setsxr, setsyu, setsyd]
}

// Spatial Hash functions; A grid that is used to find nearby objects without iterating through every single object
// The Hash is a 2D array with a list as each element. This list is a 'cell' and a cell contains every object in that space.
let hash = []
let worldw = 1 // Size of world in pixels
let worldh = 1
let cw = 0 // Number of cells horizontally -1
let ch = 0 // Number of cells vertically -1
let cellSize = 100
function createSpatialHash(ww, wh, cs) {
	cellSize = cs
	cw = Math.ceil(ww/cellSize)
	ch = Math.ceil(wh/cellSize)
	worldw = ww
	worldh = wh

	hash = []
	for (let x = 0; x <= cw; x++) {
		hash[x] = []
		for (let y = 0; y <= ch; y++) {
			hash[x][y] = new Map()
		}
	}
}

// TODO: Make this a class so there can be multiple instances (Needed for mini-games)
// Given world corrdinates find which cell range the object is in
function getSpatialCoords(x1, y1, x2, y2) {
	let cx1 = Math.floor(Math.min(Math.max(x1, 0), worldw)/cellSize)
	let cy1 = Math.floor(Math.min(Math.max(y1, 0), worldh)/cellSize)
	let cx2 = Math.floor(Math.min(Math.max(x2, 0), worldw)/cellSize)
	let cy2 = Math.floor(Math.min(Math.max(y2, 0), worldh)/cellSize)
	return [cx1, cy1, cx2, cy2]
}

function getSpatialCell(cx, cy) {
	return hash[cx][cy]
}

function putToSpatialCell(cx, cy, obj) {
	hash[cx][cy].set(obj, obj) // Store the object in the hash by directly using obj as the key
}

function removeFromSpatialCell(cx, cy, obj) {
	hash[cx][cy].delete(obj)
}

// Compiles all objects in a range of cells into a list
let objAppearedMap = new Map()
function retrieveSpatialCells(x1, y1, x2, y2) {
	objAppearedMap.clear()
	let [cx1, cy1, cx2, cy2] = getSpatialCoords(x1, y1, x2, y2)
	// Loop through range of cells
	for (let x = cx1; x <= cx2; x++) {
		for (let y = cy1; y <= cy2; y++) {
			// Add objects to object list without duplicates
			let cell = getSpatialCell(x, y)
			for (const [obji, obj] of cell.entries()) {
				objAppearedMap.set(obj, obj)
			}
		}
	}
	return objAppearedMap
}

// Debug draw all hitboxes
function drawPhysics(objs) {
	// Draw Spatial Hash
	DRAW.setColor(0,0,0,0.5)
	DRAW.setFont(FONT.caption)
	DRAW.setLineWidth(1)
	for (let x = 0; x <= cw; x++) {
		for (let y = 0; y <= ch; y++) {
			DRAW.polygon([x*cellSize,y*cellSize, x*cellSize+cellSize,y*cellSize, x*cellSize+cellSize,y*cellSize+cellSize, x*cellSize,y*cellSize+cellSize], "line")
			DRAW.text(getSpatialCell(x, y).size,x*cellSize+cellSize/2,y*cellSize+cellSize/2)
		}
	}
	// Draw hitboxes
	for (const [_, objsList] of Object.entries(objs)) { // Look through list of object types
		for (const [i, a] of Object.entries(objsList)) { // Look at each object
			DRAW.push()
			DRAW.translate(a.x, a.y)

			// Draw object's shape and bounding box
			DRAW.setColor(0,0,0,1.0)
			if (a.DEBUGCOLLIDED != false) { // Turn red if currently colliding
				DRAW.setColor(255,0,0,1.0)
			}
			DRAW.setLineWidth(1)
			DRAW.rectangle(a.shape.x1, a.shape.y1, a.shape.w, a.shape.h, "line")
			DRAW.setLineWidth(2)
			DRAW.polygon(a.shape.v, "line")

			DRAW.circle(0, 0, 3, "fill") // Object center (Shape's origin)

			DRAW.pop()
		}
	}
}