//Physics object base class

class PhysicsObject {
	//Initialize: x pos, y pos
	constructor (x, y) {
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
		let [cx, cy, cw, ch] = [this.cellx, this.celly, this.cellw, this.cellh]
		let [ncx, ncy, ncw, nch] = getSpatialCoords(this.x+this.shape.x1,this.y+this.shape.y1,this.x+this.shape.x2,this.y+this.shape.y2)
		if (!(cx == ncx && cy == ncy && cw == ncw && ch == nch)) {
			// TODO: Optimize this
			// Remove references to this object from old location
			for (let x = cx; x <= cw; x++) {
				for (let y = cy; y <= ch; y++) {
					removeFromSpatialCell(x, y, this)
				}
			}
			// Add references to this object in new location
			for (let x = ncx; x <= ncw; x++) {
				for (let y = ncy; y <= nch; y++) {
					putToSpatialCell(x, y, this)
				}
			}
			[this.cellx, this.celly, this.cellw, this.cellh] = [ncx, ncy, ncw, nch]
		}
	}

	destroy() {

	}
}