// Rendering functions for a '2d' canvas.

class Render {
	constructor (canvas) {
		this.c = false
		if (canvas) {
			this.setCanvas(canvas)
		}

		this.color = [255,255,255,1]
		this.font = false
		this.fontOutline
	}

	setCanvas(canvas) {
		this.c = canvas
	}

	// Erase everything
	clear(r,g,b,a=1.0) {
		this.c.fillStyle = `rgb(${r},${g},${b})`
		this.c.clearRect(0, 0, canvasWidth, canvasHeight)
	}

	// Set color of next thing that will be drawn
	setColor(r,g,b,a=1.0) {
		this.color[0] = r
		this.color[1] = g
		this.color[2] = b
		this.color[3] = a
		this.c.fillStyle = `rgb(${r},${g},${b})`
		this.c.strokeStyle = `rgb(${r},${g},${b})`
		this.c.globalAlpha = a;
	}

	// Draw image
	// ImageObject, [image bounds (x, y, w, h)] or null, x pos., y pos., rotation, scale x, scale y, offset x, offset y
	image(img, anim, x, y, r = 0, sx = 1, sy = 1, ox = 0, oy = 0) {
		this.push() // save current render state to undo all transformations

		// Get dimensions of image
		let [qx, qy, qw, qh] = [0, 0, img.w, img.h]
		if (anim) {
			[qx, qy, qw, qh] = anim
		}

		// Transform image
		this.c.translate(Math.floor(x), Math.floor(y))
		this.c.rotate(r)
		this.c.scale(sx, sy)
		
		// Recolor image if possible, then render image
		let color = this.color
		let image = img.image
		if (img.colorable && ((color[0] == 255 && color[1] == 255 && color[2] == 255 && color[3] == 1.0) != true)) {
			img.setColor(color[0],color[1],color[2],color[3])
			image = img.canvas
		}
		this.c.drawImage(image, qx, qy, qw, qh, -qw*ox, -qh*oy, qw, qh)

		this.pop() // undo all transformations
	}

	// Draw primitives
	rectangle(x, y, w, h, fill) {
		if (fill == "line") {
			this.c.beginPath()
			this.c.rect(x, y, w, h)
			this.c.stroke()
		} else {
			this.c.fillRect(x, y, w, h)
		}
	}

	circle(x, y, r, fill) {
		this.c.beginPath()
		this.c.arc(x, y, r, 0, 2 * Math.PI)
		if (fill == "line") {
			this.c.stroke()
		} else {
			this.c.fill()
		}
	}

	line(points) {

	}

	// Draw polygon given [x,y,x,y,...], fill ("fill" or "line")
	polygon(points, fill) {
		if (points.length < 4) {
			console.error("At least two points are required to draw a polygon.");
			return
		}

		// Draw a line from point to point
		this.c.beginPath()
		this.c.moveTo(points[0], points[1]) // Move to the first point
		for (let i = 2; i < points.length; i += 2) {
			const x = points[i]
			const y = points[i + 1]
			this.c.lineTo(x, y) 
		}
		this.c.closePath() // Close the path to connect the last point to the first point

		// Stroke or fill the polygon as desired
		if (fill == "line") {
			this.c.stroke()
		} else {
			this.c.fill()
		}
	}

	// Font; RenderFont object, optional outline with thickness in px
	setFont(font, outline) {
		this.c.font = `${font.size}px ${font.name}`
		if (outline != null) {
			this.fontOutline = outline
		} else {
			this.fontOutline = false
		}
	}

	text(string, x, y, align="left") {
		this.c.textAlign = align // left, right, center
		if (this.fontOutline) {
			// Draw outline by rendering font with thick line strokes
			// Preserve old color and line width to not interfere with later draw calls
			let [oldLineWidth, oldMiterLimit] = [this.c.lineWidth, this.c.miterLimit]
			let [ocr,ocg,ocb,oca] = [this.color[0],this.color[1],this.color[2],this.color[3]]
			this.c.miterLimit = 2
			this.setColor(0,0,0,1.0)
			this.setLineWidth(this.fontOutline || 8)
			this.c.strokeText(string, x, y)
			this.setColor(ocr,ocg,ocb,oca)
			this.setLineWidth(oldLineWidth)
			this.c.miterLimit = oldMiterLimit
		}
		this.c.fillText(string, x, y)
	}

	setLineWidth(thickness) {
		ctx.lineWidth = thickness
	}

	// Transform
	translate(x, y) {
		this.c.translate(x, y)
	}

	push() {
		this.c.save()
	}

	pop() {
		this.c.restore()
	}
}

class RenderImage {
	constructor (src, asyncFunc) {
		this.image = new Image()
		this.image.src = src
		this.src = src
		this.w = 1
		this.h = 1
		this.image.onload = () => {
			this.w = this.image.width
			this.h = this.image.height
			if (this.colorable) {
				this.canvas.width = this.w
				this.canvas.height = this.h
			}
			// Images are loaded asynchronously, so pass this function if you need to do anything with the image data
			if (asyncFunc) {
				asyncFunc()
			}
		}
		this.canvas = false
		this.colorable = false
	}

	makeColorable () {
		this.colorable = true
		this.canvas = document.createElement("canvas")
		this.c = this.canvas.getContext("2d")
		this.canvas.width = this.w
		this.canvas.height = this.h
	}

	setColor(r, g, b, a) {
		this.c.save()
		this.c.fillStyle = `rgb(${r},${g},${b})`
		this.c.globalAlpha = a
		this.c.fillRect(0, 0, this.w, this.h)
		this.c.globalCompositeOperation = "destination-atop"
		this.c.globalAlpha = 1
		this.c.drawImage(this.image, 0, 0)
		// this.c.globalCompositeOperation = "lighter"
		this.c.globalCompositeOperation = "multiply"
		this.c.globalAlpha = 1
		this.c.drawImage(this.image, 0, 0)
		this.c.restore()
	}
}

class RenderFont {
	constructor (name, size) {
		this.name = name
		this.size = size || 20
	}
}