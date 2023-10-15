// Rendering functions for a '2d' canvas.

class Render {
    constructor (canvas) {
        this.c = false
        if (canvas) {
            this.setCanvas(canvas)
        }

        this.color = [255,255,255,1]
        this.font = false
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
        this.c.globalAlpha = a;
    }

    // Draw image
    image(img, anim, x, y, r = 0, sx = 1, sy = 1, ox = 0, oy = 0) {
        this.push()

		let [qx, qy, qw, qh] = [0, 0, img.w, img.h]
        if (anim) {
            [qx, qy, qw, qh] = anim.getSprite()
        }

		this.c.translate(Math.floor(x), Math.floor(y))
        this.c.rotate(r)
        this.c.scale(sx, sy)
        
        let image = img.image
        if (img.colorable) {
            img.setColor(this.color[0],this.color[1],this.color[2],this.color[3])
            image = img.canvas
        }
        this.c.drawImage(image, qx, qy, qw, qh, -qw*ox, -qh*oy, qw, qh)

        this.pop()
    }

    // Draw primitives
    rectangle(x, y, w, h) {
        this.c.fillRect(x, y, w, h)
    }

    circle(x, y, r, segments) {

    }

    line(points) {

    }

    setFont(font) {
        this.c.font = `${font.size}px ${font.name}`;
    }

    text(string, x, y, align="left") {
        this.c.textAlign = align // left, right, center
		this.c.fillText(string, x, y)
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
    constructor (src) {
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
        this.c.globalCompositeOperation = "lighter"
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