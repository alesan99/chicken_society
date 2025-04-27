// Rendering functions for a 'webgl' canvas.

class Render {
	constructor (canvas, width, height) {
		this.c = false;
		if (canvas) {
			this.setCanvas(canvas);
		}
		this.w = width;
		this.h = height;

		this.color = [1,1,1,1];
		this.font = false;

		// Set up WEBGL shaders
		// Define vertex shader code
		this.vertexShaderSource = `
			attribute vec2 a_position;
			attribute vec2 a_textureCoord;
			varying vec2 v_textureCoord;

			uniform float u_canvasWidth;
			uniform float u_canvasHeight;

			void main() {
				vec2 position = a_position / vec2(u_canvasWidth*0.5, u_canvasHeight*0.5);
				gl_Position = vec4(position.x-1.0, 1.0-position.y, 0.0, 1.0);
                v_textureCoord = a_textureCoord;
			}
		`;

		// Define fragment shader code
		this.fragmentShaderSource = `
			precision mediump float;
			uniform vec4 u_color;
			uniform bool u_useTexture;
			varying vec2 v_textureCoord;
			uniform sampler2D u_sampler;

			void main() {
				if (u_useTexture) {
					gl_FragColor = texture2D(u_sampler, v_textureCoord) * u_color;
				} else {
					gl_FragColor = u_color;
				}
			}
		`;
		
		// Create shaders
		this.vertexShader = this.c.createShader(this.c.VERTEX_SHADER);
		this.c.shaderSource(this.vertexShader, this.vertexShaderSource);
		this.c.compileShader(this.vertexShader);

		this.fragmentShader = this.c.createShader(this.c.FRAGMENT_SHADER);
		this.c.shaderSource(this.fragmentShader, this.fragmentShaderSource);
		this.c.compileShader(this.fragmentShader);

		// Create shader program
		this.shaderProgram = this.c.createProgram();
		this.c.attachShader(this.shaderProgram, this.vertexShader);
		this.c.attachShader(this.shaderProgram, this.fragmentShader);
		this.c.linkProgram(this.shaderProgram);
		this.c.useProgram(this.shaderProgram);

		// Enable alpha blending
		this.c.enable(this.c.BLEND);
		this.c.blendFunc(this.c.SRC_ALPHA, this.c.ONE_MINUS_SRC_ALPHA);
		//this.c.blendFunc(this.c.ONE, this.c.ONE_MINUS_SRC_ALPHA); // Pre-multiplied

		// Create buffer
		this.vertexBuffer = this.c.createBuffer();
		this.textureCoordBuffer = this.c.createBuffer();
		//this.c.bufferData(this.c.ARRAY_BUFFER, new Float32Array(this.verts), this.c.STATIC_renderer);

		// Define the values for u_canvasWidth and u_canvasHeight
		this.c.uniform1f(this.c.getUniformLocation(this.shaderProgram, "u_canvasWidth"), this.w);
		this.c.uniform1f(this.c.getUniformLocation(this.shaderProgram, "u_canvasHeight"), this.h);

		// Send uniform "u_useTexture"
		this.useTextureUniform = this.c.getUniformLocation(this.shaderProgram, "u_useTexture");

		// Get attribute location and enable
		this.positionAttributeLocation = this.c.getAttribLocation(this.shaderProgram, "a_position");
		this.textureCoordAttributeLocation = this.c.getAttribLocation(this.shaderProgram, "a_textureCoord");
		this.c.bindBuffer(this.c.ARRAY_BUFFER, this.vertexBuffer);
		this.c.enableVertexAttribArray(this.positionAttributeLocation);
		this.c.vertexAttribPointer(this.positionAttributeLocation, 2, this.c.FLOAT, false, 0, 0);
	
		// Bind texture coordinate buffer
		this.c.bindBuffer(this.c.ARRAY_BUFFER, this.textureCoordBuffer);
		this.c.enableVertexAttribArray(this.textureCoordAttributeLocation);
		this.c.vertexAttribPointer(this.textureCoordAttributeLocation, 2, this.c.FLOAT, false, 0, 0);

		this.clear(0, 0, 0, 1.0);

		// renderer the rectangle
		//this.setColor(255,0,0,1.0)
		//this.c.rendererArrays(this.c.TRIANGLE_STRIP, 0, 4);
	}

	isPowerOf2(value) {
		return (value & (value - 1)) == 0;
	}

	setCanvas(canvas) {
		this.c = canvas;
	}

	// Erase everything
	clear(r,g,b,a=1.0) {
		this.c.clearColor(r/255.0,g/255.0,b/255.0,a);
		this.c.clear(this.c.COLOR_BUFFER_BIT);
	}

	// Set color of next thing that will be renderern
	setColor(r,g,b,a=1.0) {
		this.color = [r/255.0,g/255.0,b/255.0,a];
		this.c.uniform4fv(this.c.getUniformLocation(this.shaderProgram, "u_color"), this.color);
	}

	// renderer image
	image(img, anim, x = 0, y = 0, r = 0, sx = 1, sy = 1, ox = 0, oy = 0) {
		//this.c.bindTexture(this.c.TEXTURE_2D, imageTexture);

		// Get dimensions of image
		let [qx, qy, qw, qh] = [0, 0, img.w, img.h];
		if (anim) {
			[qx, qy, qw, qh] = anim;
		}

		if (img.w == 1 && img.h == 1) {
			return false;
		}
		
		// Set up texture coordinates
		let [rx, ry, rw, rh] = [x-qw*ox*sx, y-qh*oy*sy, qw*sx, qh*sy];
		let vertices = [
			rx, ry,
			rx, ry + rh,
			rx + rw, ry,
			rx + rw, ry + rh
		];
		let textureCoordinates = [
			qx/img.w, qy/img.h,
			qx/img.w, (qy+qh)/img.h,
			(qx+qw)/img.w, qy/img.h,
			(qx+qw)/img.w, (qy+qh)/img.h,
		];
		this.c.uniform1i(this.useTextureUniform, 1); // Use texture
		this.c.bindBuffer(this.c.ARRAY_BUFFER, this.vertexBuffer);
		this.c.bufferData(this.c.ARRAY_BUFFER, new Float32Array(vertices), this.c.STATIC_renderer);
		this.c.bindBuffer(this.c.ARRAY_BUFFER, this.textureCoordBuffer);
		this.c.bufferData(this.c.ARRAY_BUFFER, new Float32Array(textureCoordinates), this.c.STATIC_renderer);
		
		this.c.activeTexture(this.c.TEXTURE0);
		this.c.bindTexture(this.c.TEXTURE_2D, img.texture);
		this.c.uniform1i(this.c.getUniformLocation(this.shaderProgram, "u_sampler"), 0);

		this.c.rendererArrays(this.c.TRIANGLE_STRIP, 0, 4);

		// temporarily render rectangle
		//this.rectangle(x-qw*ox*sx, y-qh*oy*sy, qw*sx, qh*sy, "fill");
	}

	// renderer primitives
	rectangle(x, y, w, h, fill) {
		if (fill == "line") {
			let vertices = [
				x, y,
				x, y + h,
				x + w, y + h,
				x + w, y,
				x, y,
			];

			this.c.uniform1i(this.useTextureUniform, 0); // Don't use texture
			this.c.bindBuffer(this.c.ARRAY_BUFFER, this.vertexBuffer);
			this.c.bufferData(this.c.ARRAY_BUFFER, new Float32Array(vertices), this.c.STATIC_renderer);
			this.c.rendererArrays(this.c.LINE_STRIP, 0, 5);
		} else {
			let vertices = [
				x, y,
				x, y + h,
				x + w, y,
				x + w, y + h
			];

			this.c.uniform1i(this.useTextureUniform, 0); // Don't use texture
			this.c.bindBuffer(this.c.ARRAY_BUFFER, this.vertexBuffer);
			this.c.bufferData(this.c.ARRAY_BUFFER, new Float32Array(vertices), this.c.STATIC_renderer);
			this.c.rendererArrays(this.c.TRIANGLE_STRIP, 0, 4);
		}
	}

	circle(x, y, r, segments) {

	}

	line(...points) {

	}
	
	// renderer polygon given [x,y,x,y,...], fill ("fill" or "line")
	polygon(points, fill) {

	}

	setFont(font) {

	}

	// Get width of text when using the current font.
	getTextWidth(text) {
		return 0;
	}

	// Wrap text so it fits within a rectangle
	wrapText(text, width) {
		return [text];
	}

	text(string, x, y, align) {

	}

	setLineWidth(thickness) {

	}

	// Transform
	translate(x, y) {

	}

	push() {

	}

	pop() {

	}

	// Mask
	mask(enable) {

	}
}

let renderer;
function setRenderer(rendererObject) {
	renderer = rendererObject;
}

class RenderImage {
	constructor (src, asyncFunc) {
		this.image = new Image();
		this.image.src = src;
		this.src = src;
		this.w = 1;
		this.h = 1;

		this.texture = renderer.c.createTexture();
		renderer.c.bindTexture(renderer.c.TEXTURE_2D, this.texture);
		const level = 0;
		const internalFormat = renderer.c.RGBA;
		const width = 1;
		const height = 1;
		const border = 0;
		const srcFormat = renderer.c.RGBA;
		const srcType = renderer.c.UNSIGNED_BYTE;
		const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
		renderer.c.texImage2D(renderer.c.TEXTURE_2D, level, internalFormat,
			width, height, border, srcFormat, srcType,
			pixel);

		this.image.onload = () => {
			renderer.c.bindTexture(renderer.c.TEXTURE_2D, this.texture);
			renderer.c.texImage2D(renderer.c.TEXTURE_2D, level, internalFormat,
				srcFormat, srcType, this.image);
		
			// WebGL1 has different requirements for power of 2 images
			// vs non power of 2 images so check if the image is a
			// power of 2 in both dimensions.
			// if (renderer.isPowerOf2(image.width) && renderer.isPowerOf2(image.height)) {
			//    // Yes, it's a power of 2. Generate mips.
			//    renderer.c.generateMipmap(renderer.c.TEXTURE_2D);
			// } else {
			// No, it's not a power of 2. Turn off mips and set
			// wrapping to clamp to edge
			renderer.c.texParameteri(renderer.c.TEXTURE_2D, renderer.c.TEXTURE_WRAP_S, renderer.c.CLAMP_TO_EDGE);
			renderer.c.texParameteri(renderer.c.TEXTURE_2D, renderer.c.TEXTURE_WRAP_T, renderer.c.CLAMP_TO_EDGE);
			renderer.c.texParameteri(renderer.c.TEXTURE_2D, renderer.c.TEXTURE_MIN_FILTER, renderer.c.LINEAR);
			//}

			this.w = this.image.width;
			this.h = this.image.height;
			if (this.colorable) {
				this.canvas.width = this.w;
				this.canvas.height = this.h;
			}
			// Images are loaded asynchronously, so pass this function if you need to do anything with the image data
			if (asyncFunc) {
				asyncFunc();
			}
		};
		this.canvas = false;
		this.colorable = false;
	}

	makeColorable () {
		
	}

	setColor(r, g, b, a) {

	}
}

class RenderFont {
	constructor (name, size) {
		this.name = name;
		this.size = size || 20;
	}
}

export { Render, RenderImage, RenderFont, setRenderer };