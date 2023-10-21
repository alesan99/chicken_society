// Collision & physics system

// Update physics; (list of objects, deltaTime)
function updatePhysics(objs, dt) {
	for (const [i, a] of Object.entries(objs)) {
		
	}
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

// TODO: All physics objects should be a subclass of a physics object class that has a function to update the postion & automatically update cells
// Given world corrdinates find which cell range the object is in
function getSpatialCoords(x, y, w, h) {
	let cx = Math.floor(Math.min(Math.max(x, 0), worldw)/cellSize)
	let cy = Math.floor(Math.min(Math.max(y, 0), worldh)/cellSize)
	let cw = Math.floor(Math.min(Math.max(x+w, 0), worldw)/cellSize)-cx
	let ch = Math.floor(Math.min(Math.max(y+h, 0), worldh)/cellSize)-cy
	return [cx, cy, cw, ch]
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

// Debug draw all hitboxes
function drawPhysics() {
	for (let x = 0; x <= cw; x++) {
		for (let y = 0; y <= ch; y++) {
			DRAW.polygon([x*cellSize,y*cellSize, x*cellSize+cellSize,y*cellSize, x*cellSize+cellSize,y*cellSize+cellSize, x*cellSize,y*cellSize+cellSize], "line")
			DRAW.text(getSpatialCell(x, y).size,x*cellSize+cellSize/2,y*cellSize+cellSize/2)
		}
	}
}