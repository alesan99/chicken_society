//Character object, a 'chicken' with a collision box and the ability to move

let dir_lookup = {up: 2, down: 0, left: 1, right: 1}

class Character {
	//Initialize: x pos, y pos, width, height
	constructor (x, y, w, h, name) {
		// Collision
		this.x = x || 0
		this.y = y || 0
		this.w = w //Width
		this.h = h //Height

		// Properties
		this.name = name || "NPC" //name
		this.speed = 200 //Speed (px/sec)
		this.controller = false //Is it being controlled?
		this.area = "" //Current area

		// Graphics
		this.sprite = SPRITE.chicken
		this.anim = new Animation(this.sprite, 0)
		this.anim.setFrame(0,0)
		this.walking = false
		this.oldwalking = this.walking
		this.dir = "down"
		this.flip = 1

		this.timer = 0
	}

	// Move: dt, direction normal x, direction normal y
	move(dt, nx, ny) {
		this.x += nx*this.speed*dt
		this.y += ny*this.speed*dt

		// Find direction player is facing
		this.oldwalking = this.walking
		this.walking = true
		if (nx == 0 && ny == 0) {
			this.walking = false
		} else if (Math.abs(ny) >= Math.abs(nx)) {
			if (ny > 0) {
				this.dir = "down" // Down
				this.flip = 1
			} else {
				this.dir = "up" // Up
				this.flip = 1
			}
		} else {
			if (nx > 0) {
				this.dir = "right" // Right
				this.flip = 1
			} else {
				this.dir = "left" // Left
				this.flip = -1
			}
		}
	}

	update(dt) {
		if (this.walking != this.oldwalking) {
			if (this.walking) {
				this.anim.playAnimation(ANIM.walk, 0.2)
			} else {
				this.anim.stopAnimation(null)
			}
		}
		// Face in the current direction
		this.anim.setFrame(null, dir_lookup[this.dir])
		// Update walking or emote animation
		this.anim.update(dt)

		this.timer += dt
	}

	//TODO: Render
	draw() {
		let [x, y, w, h] = this.anim.getSprite()
		//ctx.fillStyle = "black";
		//ctx.fillRect(this.x, this.y, this.w, this.h) //collision

		ctx.save()
		ctx.translate(Math.floor(this.x)+this.w/2, Math.floor(this.y)+this.h/2)
		// ctx.rotate(this.timer) // Spin
		ctx.scale(this.flip, 1)
		ctx.drawImage(IMG.chicken, x, y, w, h, -w/2, -h/2, w, h) //sprite
		ctx.restore()

		// Nametag
		ctx.font = "20px Arial";
		ctx.fillStyle = "black";
		ctx.textAlign = 'center';
		ctx.fillText(PROFILE.name, Math.floor(this.x)+this.w/2, Math.floor(this.y)-2);
	}
}