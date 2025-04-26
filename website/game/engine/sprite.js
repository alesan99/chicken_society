//Sprite object; Takes in an image with multiple frames and splits it up to render just one frame

import { DRAW } from "../main.js";

class Sprite {
	/**
	 * Represents a series of cropped frames from an image. A "sprite" sheet.
	 * image, frame count x & y, offset x & y, frame width & height, offset width & height to start splitting the image
	 * @param {RenderImage} img - A RenderImage object
	 * @param {Number} fx - Frame count horizontally
	 * @param {Number} fy - Frame count vertically
	 * @param {Number} w - Width of each frame in pixels
	 * @param {Number} h - Height of each frame in pixels
	 * @param {Number} ox - Origin x in pixels, this is where the frames start
	 * @param {Number} oy - Origin y in pixels, this is where the frames start
	 * @param {Number} sepx - Horizontal separation between frames in pixels
	 * @param {Number} sepy - Vertical separation between frames in pixels
	 */
	constructor (img, fx=1, fy=1, w, h, ox=0, oy=0, sepx=0, sepy=0) {
		this.img = img;
		this.w = w;
		this.h = h;
		this.frame = [];
		for (let y = 0; y < fy; y++) { // Rows
			this.frame[y] = [];
			for (let x = 0; x < fx; x++) { // Columns
				this.frame[y][x] = [x*(w+sepx)+ox, y*(h+sepy)+oy, w, h]; // x, y, w, h
			}
		}
	}

	/**
	 * Gets the cropped region of a frame.
	 * @param {Number} x - Horizontal frame number
	 * @param {Number} y - Vertical frame number
	 * @returns {Array} - [x, y, w, h]
	 */
	getFrame (x=0, y=0) {
		return this.frame[y][x];
	}
}

//Animation object; Takes in sprite and decides which frame to display

class Animation {
	/**
	 * Represents a selected frame from a Sprite object. Enables animation.
	 * @param {Sprite} sprite - A Sprite object. These are all the possible animation frames.
	 * @param {*} fx - The starting frame x
	 * @param {*} fy - The starting frame y
	 */
	constructor (sprite, fx=0, fy=0) {
		this.sprite = sprite;
		this.framex = fx || 0;
		this.framey = fy || 0;

		// Animation
		this.playing = false;
		this.frames = false;
		this.animLength = 0;
		this.timer = 0;
		this.delay = 0;
	}

	/**
	 * Update the current animation, if any.
	 * @param {Number} dt - Time elapsed since last frame in seconds
	 */
	update (dt) {
		if (this.playing) {
			// Update animation
			let delay = this.delay;
			if (delay.isArray) { // If array of delays, set to the current delay
				delay = delay[this.animFrameNum || 0];
			}

			// this.timer = (this.timer + (1/delay)*dt)%(this.animLength)
			this.timer += dt;
			while (this.timer > delay) {
				this.timer -= delay;

				this.animFrameNum += 1; // position in the animation, not the actual frame number

				// Check if animation finished if it shouldn't loop
				if ((this.stopFrame != null) && this.animFrameNum >= (this.animLength)) {
					this.setFrame(this.stopFrame, null);
					this.timer = 0;
					this.playing = false;
					break;
				} else {
					// Update frame
					this.animFrameNum = this.animFrameNum%this.animLength; // Loop animation
					this.setFrame(this.frames[this.animFrameNum], null);

					if (delay.isArray) { // If array of delays, set to the current delay
						delay = delay[this.animFrameNum || 0];
					}
				}
			}
		}
	}
	/**
	 * Play an animation represented by a list of frames. The frames need to be layed out horizontally.
	 * @param {Array} frames - List of frames to play [0, 1, 2 ..]
	 * @param {Number} delay - Delay between frames in seconds
	 * @param {Number} [dont_loop=null] - (Optional) Frame to set to after animation is done
	 */
	playAnimation (frames, delay, dont_loop) {
		this.playing = true;
		this.frames = frames;
		this.animLength = frames.length;

		this.timer = 0;
		this.delay = delay;
		this.animFrameNum = 0;
		this.setFrame(this.frames[this.animFrameNum], null);

		this.stopFrame = dont_loop;
	}

	/**
	 * Stop the current animation and set the frame to a specific frame.
	 * @param {Number} fx - (Optional) Frame x to set to
	 * @param {Number} fy - (Optional) Frame y to set to
	 */
	stopAnimation (fx, fy) {
		this.playing = false;
		if ((fx != null) || (fy != null)) {
			this.setFrame(fx, fy);
		}
	}

	/**
	 * Set the current frame.
	 * @param {Number} fx - (Optional) Frame x to set to
	 * @param {Number} fy - (Optional) Frame y to set to
	 */
	setFrame (fx, fy) {
		if (fx != null) {
			this.framex = fx;
		}
		if (fy != null) {
			this.framey = fy;
		}
	}

	/**
	 * Returns the crop region [x, y, w, h] of current frame. Optional frame offset to get a different frame relative to the current one.
	 * @param {Number} offsetx - (Optional) Frame number offset x
	 * @param {Number} offsety - (Optional) Frame number offset y
	 * @returns {Array} - [x, y, w, h]
	 */
	getFrame (offsetx=0 , offsety=0) {
		let sprite_frame = this.sprite.frame[this.framey+offsety][this.framex+offsetx];
		return sprite_frame;
	}
}

// Drawable Sprite; Can be directly rendered with .draw() function

class DrawableSprite {
	/**
	 * A sprite that can be directly rendered with .draw() function.
	 * @param {Sprite} sprite - A Sprite object
	 * @param {Animation} anim - An Animation object
	 * @param {Number} drawx - x position on screen in pixels
	 * @param {Number} drawy - y position on screen in pixels
	 * @param {Number} [worldy=null] - Verticaly position in world. Used to simulate depth.
	 */
	constructor (sprite, anim, drawx, drawy, worldy) {
		this.sprite = sprite;
		this.anim = anim;
		this.drawx = drawx; // Position on screen
		this.drawy = drawy;
		this.y = worldy || this.drawx; // Position in world
		this.visible = true;
	}

	/**
	 * Draw the sprite to the screen.
	 */
	draw () {
		let anim = this.sprite.getFrame(0,0);
		if (this.anim) {
			anim = this.anim.getFrame(0,0);
		}
		DRAW.image(this.sprite.img, anim, this.drawx, this.drawy);
	}
}

export { Sprite, Animation, DrawableSprite };