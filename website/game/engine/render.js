// Rendering functions for a '2d' canvas.

class Render {
	/**
	 * Creates a wrapper for rendering to a canvas.
	 * @param {*} canvas  - HTML5 2D rendering context (canvas.getContext("2d"))
	 * @param {number} width - Width of the canvas in pixels
	 * @param {number} height - Height of the canvas in pixels
	 */
	constructor (canvas, width, height) {
		this.c = false;
		if (canvas) {
			this.setCanvas(canvas);
		}
		this.width = width;
		this.height = height;

		this.color = [255,255,255,1];
		this.font = false;
		this.fontOutline;
	}

	/**
	 * Set an HTML rendering context to render to.
	 * @param {*} canvas - HTML5 2D rendering context (canvas.getContext("2d"))
	 */
	setCanvas(canvas) {
		this.c = canvas;
	}

	/**
	 * Erase everything. Replace everything with a color.
	 * @param {number} r - red (0 - 255)
	 * @param {number} g - green (0 - 255)
	 * @param {number} b - blue (0 - 255)
	 * @param {number} a - alpha (0 - 1)
	 */
	clear(r,g,b,a=1.0) {
		this.c.fillStyle = `rgb(${r},${g},${b})`;
		this.c.clearRect(0, 0, this.width, this.height);
	}

	/**
	 * Set color of next thing that will be drawn
	 * @param {number} r - red (0 - 255)
	 * @param {number} g - green (0 - 255)
	 * @param {number} b - blue (0 - 255)
	 * @param {number} a - alpha (0 - 1)
	 */
	setColor(r,g,b,a=1.0) {
		this.color[0] = r;
		this.color[1] = g;
		this.color[2] = b;
		this.color[3] = a;
		this.c.fillStyle = `rgb(${r},${g},${b})`;
		this.c.strokeStyle = `rgb(${r},${g},${b})`;
		this.c.globalAlpha = a;
	}

	/**
	 * Draw an image with optional crop and transformations
	 * @param {RenderImage} img - Image object to draw
	 * @param {Array} anim - Optional image bounds [x, y, w, h] or null
	 * @param {number} x - x position in pixels
	 * @param {number} y - y position in pixels
	 * @param {number} r - rotation in radians
	 * @param {number} sx - scale x (1.0 by default)
	 * @param {number} sy - scale y (1.0 by default)
	 * @param {number} ox - origin x (0 - 1)
	 * @param {number} oy - origin y (0 - 1)
	 */
	image(img, anim, x = 0, y = 0, r = 0, sx = 1, sy = 1, ox = 0, oy = 0) {
		let transform = ((r != 0) || (sx != 1) || (sy != 1) || (ox != 0) || (oy != 0)); // For perfomance reasons, only attempt to transform if settings are not default
		if (transform) {
			// Transform image
			this.push(); // save current render state to undo all transformations
			this.c.translate(Math.floor(x), Math.floor(y));
			this.c.rotate(r);
			this.c.scale(sx, sy);
		}

		// Get dimensions of image
		let [qx, qy, qw, qh] = [0, 0, img.w, img.h];
		if (anim) {
			[qx, qy, qw, qh] = anim;
		}
		
		// Recolor image if possible, then render image
		let color = this.color;
		let image = img.image;
		if (img.colorable && ((color[0] == 255 && color[1] == 255 && color[2] == 255 && color[3] == 1.0) != true)) {
			img.setColor(color[0],color[1],color[2],color[3]);
			image = img.canvas;
		}
		if (!transform) {
			this.c.drawImage(image, qx, qy, qw, qh, x, y, qw, qh);
		} else {
			this.c.drawImage(image, qx, qy, qw, qh, -qw*ox, -qh*oy, qw, qh);
			this.pop(); // undo all transformations
		}
	}

	// Draw primitives //
	/**
	 * Draw a rectangle with optional fill style.
	 * @param {number} x - x position in pixels
	 * @param {number} y - y position in pixels
	 * @param {number} w - width in pixels
	 * @param {number} h - height in pixels
	 * @param {"fill"|"line"} [fill="fill"] - "fill" or "line"
	 */
	rectangle(x, y, w, h, fill) {
		if (fill == "line") {
			this.c.beginPath();
			this.c.rect(x, y, w, h);
			this.c.stroke();
		} else {
			this.c.fillRect(x, y, w, h);
		}
	}

	/**
	 * Draw a circle with optional fill style.
	 * @param {number} x - x position in pixels
	 * @param {number} y - y position in pixels
	 * @param {number} r - radius in pixels
	 * @param {"fill"|"line"} [fill="fill"] - "fill" or "line"
	 */
	circle(x, y, r, fill) {
		this.c.beginPath();
		this.c.arc(x, y, r, 0, 2 * Math.PI);
		if (fill == "line") {
			this.c.stroke();
		} else {
			this.c.fill();
		}
	}

	/**
	 * Draw a line from a list of points.
	 * @param {...number} points - x,y, x,y, ...
	 */
	line(...points) {
		if (points.length < 4) {
			console.error("At least two points are required to draw a line.");
			return;
		}

		this.c.beginPath();
		this.c.moveTo(points[0], points[1]);
		for (let i = 2; i < points.length; i += 2) {
			const x = points[i];
			const y = points[i + 1];
			this.c.lineTo(x, y);
		}
		this.c.stroke();
	}

	/**
	 * Draw polygon given an array of points, with optional fill style.
	 * @param {Array} points - [x,y, x,y, ...]
	 * @param {"fill"|"line"} fill - "fill" or "line"
	 */
	polygon(points, fill) {
		if (points.length < 4) {
			console.error("At least two points are required to draw a polygon.");
			return;
		}

		// Draw a line from point to point
		this.c.beginPath();
		this.c.moveTo(points[0], points[1]); // Move to the first point
		for (let i = 2; i < points.length; i += 2) {
			const x = points[i];
			const y = points[i + 1];
			this.c.lineTo(x, y);
		}
		this.c.closePath(); // Close the path to connect the last point to the first point

		// Stroke or fill the polygon as desired
		if (fill == "line") {
			this.c.stroke();
		} else {
			this.c.fill();
		}
	}

	// Font & Text //
	/**
	 * Set the font to use for text rendering, with optional outline.
	 * @param {RenderFont} font - Font object
	 * @param {number} [outline=null] - (Optional) Outline thickness in px
	 */
	setFont(font, outline) {
		this.c.font = `${font.size}px ${font.name}`;
		if (outline != null) {
			this.fontOutline = outline;
		} else {
			this.fontOutline = false;
		}
	}

	/** Get the width of a text string in the current font.
	 * @param {string} text - Text to measure
	 * @returns {number} - Width of text in pixels
	 */
	getTextWidth(text) {
		return this.c.measureText(text).width;
	}

	/** Wrap text so it fits within a rectangle with the current font.
	 * @param {string} text - Text to wrap
	 * @param {number} width - Width of rectangle in px
	 * @returns {Array} - Array of wrapped text lines
	 */
	wrapText(text, width) {
		let wrappedText = [];
		let words = text.split(" ");
		let currentLine = "";

		let i = 0;
		while (i < words.length) {
			// Add each word individually to the current line until it exceeds the width
			let word = words[i];
			let testLine = currentLine + word + " ";
			let testWidth = this.getTextWidth(testLine);

			// If word starts with \n, start a new line
			let newLine = false;
			if (word.startsWith("\n")) {
				newLine = true;
				word = word.substring(1);
			}

			if (newLine) {
				let currentLineTrim = currentLine.trim();
				if (currentLineTrim.length > 0) {
					wrappedText.push(currentLineTrim);
				}
				currentLine = "";
			} else if (testWidth > width) {
				// Width of line exceeds the width of the rectangle

				// Check if word should be broken
				let wordWidth = this.getTextWidth(word);
				if (wordWidth > width) {
					// Word is too long to fit on a line
					for (let j = 0; j < word.length; j++) {
						let partialWord = word.substring(0, j);
						let partialWidth = this.getTextWidth(partialWord);
						if (partialWidth > width) {
							// Insert partial words to list of words
							words.splice(i+1, 0, word.substring(j-1));
							word = word.substring(0,j);
							break;
						}
					}
				}
				
				// Move onto next line
				let currentLineTrim = currentLine.trim();
				if (currentLineTrim.length > 0) { // Don't add empty lines (happens when breaking up a word)
					wrappedText.push(currentLineTrim);
				}
				currentLine = word + " ";
			} else {
				// Add word to current line
				currentLine = testLine;
			}
			i++;
		}

		wrappedText.push(currentLine.trim());
		return wrappedText;
	}

	/**
	 * Render Text with optional transformations
	 * @param {string} string - Text to render
	 * @param {number} x - x position in pixels
	 * @param {number} y - y position in pixels
	 * @param {"left"|"right"|"center"} [align="left"] - Text alignment
	 * @param {number} r - rotation in radians
	 * @param {number} sx - scale x (1.0 by default)
	 * @param {number} sy - scale y (1.0 by default)
	 * @param {number} ox - origin x in pixels
	 * @param {number} oy - origin y in pixels
	 */
	text(string, x, y, align="left", r = 0, sx = 1, sy = 1, ox = 0, oy = 0) {
		this.c.textAlign = align; // left, right, center

		let transform = ((r != 0) || (sx != 1) || (sy != 1) || (ox != 0) || (ox != 0)); // For perfomance reasons, only attempt to transform if settings are not default
		if (transform) {
			// Transform image
			this.push(); // save current render state to undo all transformations
			this.c.translate(Math.floor(x), Math.floor(y));
			this.c.rotate(r);
			this.c.scale(sx, sy);
		}

		if (this.fontOutline) {
			// Draw outline by rendering font with thick line strokes
			// Preserve old color and line width to not interfere with later draw calls
			let [oldLineWidth, oldMiterLimit] = [this.c.lineWidth, this.c.miterLimit];
			let [ocr,ocg,ocb,oca] = [this.color[0],this.color[1],this.color[2],this.color[3]];
			this.c.miterLimit = 2;
			this.setColor(0,0,0,1.0);
			this.setLineWidth(this.fontOutline || 8);
			this.c.strokeText(string, x, y);
			this.setColor(ocr,ocg,ocb,oca);
			this.setLineWidth(oldLineWidth);
			this.c.miterLimit = oldMiterLimit;
		}
		if (!transform) {
			this.c.fillText(string, x, y);
		} else {
			this.c.fillText(string, -ox, -oy);
			this.pop(); // undo all transformations
		}
	}

	/**
	 * Set the thickness of lines that will be drawn when using the "line" fill style.
	 * @param {number} thickness - Line thickness in pixels
	 */
	setLineWidth(thickness) {
		this.c.lineWidth = thickness;
	}

	// Transform //
	/**
	 * Translates the following draw operations by x and y.
	 * @param {number} x - x translation in pixels
	 * @param {number} y - y translation in pixels
	 */
	translate(x, y) {
		this.c.translate(x, y);
	}

	/**
	 * Saves the current transformation modifiers, so they can be restored later.
	 */
	push() {
		this.c.save();
	}

	/**
	 * Restores the previously "pushed" transformation modifiers.
	 */
	pop() {
		this.c.restore();
	}

	/**
	 * Creates a clipping mask for the following draw operations.
	 * NON-FUNCTIONAL (as far as I can tell)
	 * @param {boolean} enable - Enable or disable the mask
	 */
	mask(enable) {
		if (enable) {
			this.c.globalCompositeOperation = "destination-atop";
		} else {
			this.c.globalCompositeOperation = "source-over";
		}
	}
}

import LoadingScreen from "../loading.js";

class RenderImage {
	/**
	 * Loads an image file so it can be rendered.
	 * @param {*} src - Path to image file
	 * @param {*} asyncFunc - Function to be called after image is done loading
	 */
	constructor (src, asyncFunc) {
		this.image = new Image();
		this.image.src = src;
		this.src = src;
		this.w = 1;
		this.h = 1;
		LoadingScreen.wait(this);
		this.image.onload = () => {
			this.w = this.image.width;
			this.h = this.image.height;
			if (this.colorable) {
				this.canvas.width = this.w;
				this.canvas.height = this.h;
			}
			this.loaded = true;
			// Images are loaded asynchronously, so pass this function if you need to do anything with the image data
			if (asyncFunc) {
				asyncFunc();
			}
		};
		this.image.onerror = () => {
			console.error(`Failed to load image: ${src}`);
			this.loaded = true;
		};
		this.canvas = false;
		this.colorable = false;
	}

	/**
	 * Enables tinting the image with setColor(r,g,b,a).
	 * This can be an expensive operation, so it needs to be enabled with this function.
	 */
	makeColorable () {
		this.colorable = true;
		this.canvas = document.createElement("canvas");
		this.c = this.canvas.getContext("2d");
		this.canvas.width = this.w;
		this.canvas.height = this.h;
	}

	/**
	 * Tints the image if it was made colorable with makeColorable().
	 */
	setColor(r, g, b, a) {
		this.c.save();
		this.c.fillStyle = `rgb(${r},${g},${b})`;
		this.c.globalAlpha = a;
		this.c.fillRect(0, 0, this.w, this.h);
		this.c.globalCompositeOperation = "destination-atop";
		this.c.globalAlpha = 1;
		this.c.drawImage(this.image, 0, 0);
		// this.c.globalCompositeOperation = "lighter"
		this.c.globalCompositeOperation = "multiply";
		this.c.globalAlpha = 1;
		this.c.drawImage(this.image, 0, 0);
		this.c.restore();
	}
}

class RenderFont {
	/**
	 * Creates a font object for rendering text.
	 * @param {*} name - Font name, corresponding to one in CSS font-family
	 * @param {*} size - Font size
	 */
	constructor (name, size) {
		this.name = name;
		this.size = size || 20;
	}
}

export { Render, RenderImage, RenderFont };