//Physics object base class

class PhysicsObject {
	//Initialize: x pos, y pos, width, height
	constructor (x, y, w, h) {
		// Position, size, and speed
		this.x = x
		this.y = y
		this.w = w
		this.h = h
		this.sx = 0
		this.sy = 0
		this.static = false
		this.active = true
		
		this.oldx = x
		this.oldy = y
		this.oldw = w
		this.oldh = h

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

	setSize(w, h) {
		if (w != null) {
			this.w = w
		}
		if (h != null) {
			this.h = h
		}
		this.updateCellLocation()
	}

	updateCellLocation() {
		// New cell location? Check.
		let [cx, cy, cw, ch] = [this.cellx, this.celly, this.cellw, this.cellh]
		let [ncx, ncy, ncw, nch] = getSpatialCoords(this.x,this.y,this.w,this.h)
		if (!(cx == ncx && cy == ncy && cw == ncw && ch == nch)) {
			// TODO: Optimize this
			// Remove references to this object from old location
			for (let x = cx; x <= cx+cw; x++) {
				for (let y = cy; y <= cy+ch; y++) {
					removeFromSpatialCell(x, y, this)
				}
			}
			// Add references to this object in new location
			for (let x = ncx; x <= ncx+ncw; x++) {
				for (let y = ncy; y <= ncy+nch; y++) {
					putToSpatialCell(x, y, this)
				}
			}
			[this.cellx, this.celly, this.cellw, this.cellh] = [ncx, ncy, ncw, nch]
		}
	}
}