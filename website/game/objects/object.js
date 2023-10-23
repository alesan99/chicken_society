//Physics object base class

class PhysicsObject {
	//Initialize: x pos, y pos
	constructor (spatialHash, x, y) {
		// Position and speed
		this.x = x
		this.y = y
		this.sx = 0
		this.sy = 0
		this.static = false
		this.active = true
		
		this.oldx = x
		this.oldy = y

		// Spatial Hash location
		this.spatialHash = spatialHash
		this.cellx = 0
		this.celly = 0
		this.cellw = 0
		this.cellh = 0
	}

	setPosition(x, y) {
		if (x != null) {
			this.x = x
		}
		if (y != null) {
			this.y = y
		}
		this.updateCellLocation()
	}

	setSize() {
		this.updateCellLocation()
	}

	updateCellLocation() {
		// New cell location? Check using bounding box of object's shape.
		let spatialHash = this.spatialHash
		let [cx, cy, cw, ch] = [this.cellx, this.celly, this.cellw, this.cellh]
		let [ncx, ncy, ncw, nch] = spatialHash.getCoords(this.x+this.shape.x1,this.y+this.shape.y1,this.x+this.shape.x2,this.y+this.shape.y2)
		if (!(cx == ncx && cy == ncy && cw == ncw && ch == nch)) {
			// TODO: Optimize this
			// Remove references to this object from old location
			for (let x = cx; x <= cw; x++) {
				for (let y = cy; y <= ch; y++) {
					spatialHash.removeFromCell(x, y, this)
				}
			}
			// Add references to this object in new location
			for (let x = ncx; x <= ncw; x++) {
				for (let y = ncy; y <= nch; y++) {
					spatialHash.putToCell(x, y, this)
				}
			}
			[this.cellx, this.celly, this.cellw, this.cellh] = [ncx, ncy, ncw, nch]
		}
	}

	// Object collided; object name, object, normal x, normal y
	collide(name, obj, nx, ny) {
		return true
	}

	destroy() {
		let [cx, cy, cw, ch] = this.spatialHash.getCoords(this.x+this.shape.x1,this.y+this.shape.y1,this.x+this.shape.x2,this.y+this.shape.y2)
		// Remove references to this object
		for (let x = cx; x <= cw; x++) {
			for (let y = cy; y <= ch; y++) {
				this.spatialHash.removeFromCell(x, y, this)
			}
		}
		this.DELETE = true
	}
}