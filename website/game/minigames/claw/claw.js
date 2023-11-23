// Claw Machine
// Move claw to left, attempt to grab prize

if (true) {
let Claw
let Prize
let Ground
let minigame

MINIGAMES["claw"] = new class {
	constructor() {
		
	}

	load() {
		minigame = this

		// Netplays data
		this.data = {} // Your data
		this.playerData = {} // Other clients' data

		this.started = false

		// Load Assets
		this.img = {}
		this.sprite = {}
		this.img.background = new RenderImage("game/minigames/claw/background.png")
		this.img.claw = new RenderImage("game/minigames/claw/claw.png")
		this.sprite.claw = new Sprite(this.img.claw, 2,1, 150,465)

		// Animation variables
		this.blinkAnim = 0

		this.objects = {
			Claw: {},
			Prize: {},
			Ground: {}
		}
		this.world = new SpatialHash(canvasWidth,canvasHeight, 100)
		this.objects["Claw"][0] = new Claw(this.world, canvasWidth-160, -200)
		this.claw = this.objects["Claw"][0]
		this.objects["Ground"][0] = new Ground(this.world, 56, canvasHeight-100, 690, 100)
		this.objects["Ground"][1] = new Ground(this.world, 0, 0, 60, 576)
		this.objects["Ground"][2] = new Ground(this.world, canvasWidth-60, 0, 60, 576)
		this.objects["Ground"][3] = new Ground(this.world, 720, 300, 26, 180)

		
		this.objects["Prize"][0] = new Prize(this.world, 164,395)
		this.objects["Prize"][1] = new Prize(this.world, 366,359)
		this.objects["Prize"][2] = new Prize(this.world, 393,286)
	}

	start() {
		// Start
		this.started = true
	}

	update(dt) {
		// Update all objects
		for (const [name, objList] of Object.entries(this.objects)) {
			for (const [id, obj] of Object.entries(objList)) {
				if (obj.update) {
					obj.update(dt)
				}
			}
		}

		updatePhysics(this.objects, this.world, dt)
	}
  
	draw() {
		// Background
		DRAW.setColor(255,255,255,1.0)
		DRAW.image(this.img.background, null, 0,0)

		// Prizes		
		for (const [id, obj] of Object.entries(this.objects["Prize"])) {
			obj.draw()
		}

		// Claw
		this.claw.draw()

		// DEBUG physics
		if (DEBUGPHYSICS) {
			drawPhysics(this.objects, this.world)
		}
	}

	// Register an object as part of the physics world
	spawnObject(name, obj, id) {
		if (id === undefined) {
			id = 0
			while (this.objects[name].hasOwnProperty(id.toString())) {
				id++
			}
		}
		this.objects[name][id] = obj
		return obj
	}

	// Multiplayer
	addPlayer(id) {
	}

	removePlayer(id) {
	}

	keyPress(key) {
		if (key == " " || key == "Space" || key == "ArrowUp") {
			this.claw.startMoving()
		}
	}

	keyRelease(key) {
		if (key == " " || key == "Space" || key == "ArrowUp") {
			this.claw.stopMoving()
		}
	}

	mouseClick(button, x, y) {
		if (button == 0) {
			this.claw.startMoving()
		}
	}

	mouseRelease(button, x, y) {
		if (button == 0) {
			this.claw.stopMoving()
		}
	}


	exit() {
	}
}()

Claw = class extends PhysicsObject {
	constructor(spatialHash, x=0, y=0) {
		super(spatialHash,x,y)
		this.x = x
		this.y = y
		this.w = 40
		this.h = 400

		this.spawnX = this.x
		this.spawnY = this.y

		this.shape = new Shape(
			-this.w/2,0,
			this.w/2,0,
			this.w/2,this.h,
			-this.w/2,this.h
		)

		this.active = true
		this.static = false
		this.sx = 0
		this.sy = 0
		this.gravity = false

		this.movable = true // Can the player control it?
		this.moving = false

		this.grabbing = false // can it grab stuff?
		this.grabbed = false // object grabbed
		this.grabTimer = 0
		this.grabX = 0 // where was object grabbed?

		this.targetsx = 0
		this.targetsy = 0

		this.setPosition(null,null)
	}
	startMoving() {
		if (this.movable && !this.moving) {
			if (spendNuggets(5)) {
				this.targetsx = -300
				this.moving = true
			}
		}
	}
	stopMoving() {
		if (this.moving) {
			this.targetsx = 0
			this.movable = false
			this.moving = false
			this.grabTimer = 0
			this.grabbing = true
		}
	}
	update(dt) {
		this.x = Math.min(this.spawnX, this.x)
		if (this.targetsx != this.sx) {
			let acc = 300
			if (this.sx > this.targetsx) {
				this.sx = Math.max(this.targetsx, this.sx-acc*dt)
			} else if (this.sx < this.targetsx) {
				this.sx = Math.min(this.targetsx, this.sx+acc*dt)
			}
		}
		
		this.y = Math.max(this.spawnY, this.y)
		if (this.targetsy != this.sy) {
			let acc = 500
			if (this.sy > this.targetsy) {
				this.sy = Math.max(this.targetsy, this.sy-acc*dt)
			} else if (this.sx < this.targetsy) {
				this.sy = Math.min(this.targetsy, this.sy+acc*dt)
			}
		}

		if (this.grabbed) {
			let prize = this.grabbed
			prize.x = this.x+this.grabX
			prize.y = this.y+this.h+prize.h/2
			prize.sy = 0
		}

		if (!this.movable) {
			this.grabTimer += dt
			
			if (this.grabTimer > 10) {
				this.movable = true
				this.grabbed = false
			} else if (this.grabTimer > 6.5 && this.x > this.spawnX-30) {
				this.targetsx = 0
			} else if (this.grabTimer > 6.5) {
				this.targetsx = 200
			} else if (this.grabTimer > 6) {
				this.targetsy = 0
			} else if (this.grabTimer > 4) {
				this.targetsy = -150
				this.grabbing = false
			} else if (this.grabTimer > 3) {
				this.targetsy = 0
			} else if (this.grabTimer > 1) {
				this.targetsy = 150
			}
		}
	}
	collide(name,obj,nx,ny) {
		if (ny < 0 && this.sy > 0) {
			this.sy = 0
		}
		if (this.grabbing && name == "Prize") {
			this.grabbed = obj
			this.grabbing = false
			this.grabX = obj.x-this.x
			return true
		}
		return true
	}
	startCollide(name,obj) {
	}
	stopCollide(name,obj) {
	}
	draw(x) {
		DRAW.setColor(255,255,255,1.0)
		let frame = 0
		if (this.grabbed) {
			frame = 1
		}
		DRAW.image(minigame.img.claw, minigame.sprite.claw.getFrame(frame), this.x, this.y, 0, 1,1, 0.5,0)
	}
}
Prize = class extends PhysicsObject {
	constructor(spatialHash, x=0, y=0) {
		super(spatialHash,x,y)
		this.w = 80
		this.h = 80
		this.x = x
		this.y = y

		let bevel = 20
		this.shape = new Shape(
			-this.w/2, -this.h/2+bevel,
			-this.w/2+bevel, -this.h/2,
			this.w/2-bevel, -this.h/2,
			this.w/2, -this.h/2+bevel,
			this.w/2, this.h/2-bevel,
			this.w/2-bevel, this.h/2,
			-this.w/2+bevel, this.h/2,
			-this.w/2, this.h/2-bevel
		)
		
		this.gravity = 300

		this.active = true
		this.static = false
		this.setPosition(null,null)
	}
	update(dt) {
	}
	draw() {
		DRAW.setColor(200,150,0,1.0)
		DRAW.circle(this.x,this.y, this.w/2, "fill")
	}
	collide(name,obj,nx,ny) {
		if (ny < 0) {
			this.sy = 0
		}
		return true
	}
}
Ground = class extends PhysicsObject {
	constructor(spatialHash, x=0, y=0, w, h) {
		super(spatialHash,x,y)
		this.w = w
		this.h = h
		this.x = x
		this.y = y

		this.shape = new Shape(
			0,0,
			this.w,0,
			this.w,this.h,
			0,this.h
		)

		this.active = true
		this.static = true
		this.setPosition(null,null)
	}
	update(dt) {
	}
	draw() {

	}
	collide() {
		return true
	}
}
}