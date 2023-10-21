// Collision & physics system

// Update physics; (list of objects, deltaTime)
function updatePhysics(objs, dt) {
	for (const [_, objsList] of Object.entries(objs)) { // Look through list of object types
		for (const [ia, a] of Object.entries(objsList)) { // Look at each object
			// Only update object if 'active' in physics space AND not static
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
							// Temporary axis-alligned bounding box collision; only counts as a collision if
							// 1. The two objects (A & B) are not currently colliding
							// 2. If object A WILL collide with object B after moving
							if (!isAABBColliding(a.x+a.shape.x1,a.y+a.shape.y1,a.x+a.shape.x2,a.y+a.shape.y2,
								b.x+b.shape.x1,b.y+b.shape.y1,b.x+b.shape.x2,b.y+b.shape.y2)
								&& isAABBColliding(nx+a.shape.x1,ny+a.shape.y1,nx+a.shape.x2,ny+a.shape.y2,
								b.x+b.shape.x1,b.y+b.shape.y1,b.x+b.shape.x2,b.y+b.shape.y2)) {
								collided = true
							}
						}
					}
				}

				// only move if it didn't collide with anything
				if (collided == false) {
					a.setPosition(nx, ny)
				}
			}
		}
	}
}

function isAABBColliding(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
	return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1
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
	DRAW.setColor(0,0,0,1.0)
	DRAW.setLineWidth(2)
	for (const [_, objsList] of Object.entries(objs)) { // Look through list of object types
		for (const [i, a] of Object.entries(objsList)) { // Look at each object
			DRAW.push()
			DRAW.translate(a.x, a.y)
			DRAW.rectangle(a.shape.x1, a.shape.y1, a.shape.w, a.shape.h, "line")
			DRAW.polygon(a.shape.v, "line")
			DRAW.pop()
		}
	}
}