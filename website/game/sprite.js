//Sprite object; Takes in an image with multiple frames and splits it up to render just one frame

class Sprite {
	//Initialize: image, frame count x & y, offset x & y, frame width & height
	constructor (img, cx, cy, ox, oy, w, h, ow, oh) {
		this.img = img
		this.frame = []
		for (let y = 0; y < cy; y++) { // Rows
			this.frame[y] = []
			for (let x = 0; x < cx; x++) { // Columns
				this.frame[y][x] = [x*ow+ox, y*oh+oy, w, h] // x, y, w, h
			}
		}
	}
}

//Animation object; Takes in sprite and decides which frame to display

class Animation {
	//Initialize: image, 
	constructor (sprite, fx, fy) {
		this.sprite = sprite
		this.framex = fx || 0
		this.framey = fy || 0

		//TODO: Animation
		this.playing = false
		this.frames = false
		this.animLength = 0
		this.timer = 0
		this.delay = 0
	}

	update (dt) {
		if (this.playing) {
			// Update animation
			let delay = this.delay
			if (delay.isArray) { // If array of delays, set to the current delay
				delay = delay[this.animFrameNum || 0]
			}

			// this.timer = (this.timer + (1/delay)*dt)%(this.animLength)
			this.timer += dt
			while (this.timer > delay) {
				this.timer -= delay

				this.animFrameNum += 1 // position in the animation, not the actual frame number

				// Check if animation finished if it shouldn't loop
				if ((this.stopFrame != null) && this.animFrameNum >= (this.animLength)) {
					this.setFrame(this.stopFrame, null)
					this.timer = 0
					this.playing = false
					break
				} else {
					// Update frame
					this.animFrameNum = this.animFrameNum%this.animLength // Loop animation
					this.setFrame(this.frames[this.animFrameNum], null)

					if (delay.isArray) { // If array of delays, set to the current delay
						delay = delay[this.animFrameNum || 0]
					}
				}
			}
		}
	}
	// Play animation: list of frames to play [0, 1, 2 ..], delay between frames, dont loop and set to a frame after animation is done
	playAnimation (frames, delay, dont_loop) {
		this.playing = true
		this.frames = frames
		this.animLength = frames.length

		this.timer = 0
		this.delay = delay
		this.animFrameNum = 0
		this.setFrame(this.frames[this.animFrameNum], null)

		this.stopFrame = dont_loop
	}

	stopAnimation (frame) {
		this.playing = false
		if (frame != null) {
			this.setFrame(frame)
		}
	}

	setFrame (fx, fy) {
		if (fx != null) {
			this.framex = fx
		}
		if (fy != null) {
			this.framey = fy
		}
	}

	// Returns x, y, w, h of current frame; offset gets a frame relative to the current frame
	getSprite (offsetx=0 , offsety=0) {
		let sprite_frame = this.sprite.frame[this.framey+offsety][this.framex+offsetx]
		return sprite_frame
	}
}