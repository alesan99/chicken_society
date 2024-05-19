// A particle object
// This is a small little animation that briefly appears in the world
// This can be something like a gunshot or dust cloud

class Particle {
	constructor(x, y, image, sprite, anim, delay=0.1) {
		this.x = x
		this.y = y
		this.image = image
		this.sprite = sprite
		this.anim = new Animation(this.sprite, 0)
		this.anim.playAnimation(anim, delay, 0)
	}

	update(dt) {
		// Update the particle
		this.anim.update(dt)

		if (this.anim.playing == false) {
			// Remove the particle
			this.destroy()
			return true
		}
	}

	draw() {
		// Draw the particle
		DRAW.image(this.image, this.anim.getFrame(), this.x,this.y, 0, 1,1, 0.5,0.5)
	}

	destroy() {
		this.DELETED = true
	}
}