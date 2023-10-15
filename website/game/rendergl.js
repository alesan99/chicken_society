// Rendering functions for a 'webgl' canvas.

class Render {
    constructor (canvas) {
        this.c = false
        if (canvas) {
            this.setCanvas(canvas)
        }

        this.color = [1,1,1,1]
        this.font = false
	}

    setCanvas(canvas) {
        this.c = canvas
    }

    // Erase everything
    clear(r,g,b,a=1.0) {
        this.c.clearColor(r,g,b,1.0);
        this.c.clear(this.c.COLOR_BUFFER_BIT);
    }

    // Set color of next thing that will be drawn
    setColor(r,g,b,a=1.0) {
        this.c.clearColor(r, g, b, a);
    }

    // Draw image
    image(img, x, y, r, sx, sy, qx, qy, qw, qh) {
        this.c.bindTexture(this.c.TEXTURE_2D, imageTexture);
    }

    // Draw primitives
    rectangle(x, y, w, h) {

    }

    circle(x, y, r, segments) {

    }

    line(points) {

    }

    setFont(font) {

    }

    text(string, x, y, align) {

    }

    // Transform
    translate(x, y) {

    }

    push() {

    }

    pop() {

    }
}

class RenderImage {
    constructor (src) {
        this.image = new Image()
        this.image.src = src
	}

    makeColorable () {
        
    }
}

class RenderFont {
    constructor (name, size) {

	}
}