// TODO: Improve this code and comment it

let RubberChicken
let Fence
let Ground
let minigame

const MinigameRunner = new class {
	constructor() {
		
	}

	load() {
		minigame = this

		this.started = false
		this.highscore = 0

		this.img = {}
		this.sprite = {}
		this.img.chicken = new RenderImage("game/minigames/runner/rubberchicken.png")
		this.sprite.chicken = new Sprite(this.img.chicken, 5,1, 96,128)
		this.img.arcadeCabinet = new RenderImage("game/minigames/runner/arcade_cabinet.png")
		this.img.fence = new RenderImage("game/minigames/runner/fence.png")
		this.img.background = new RenderImage("game/minigames/runner/background.png")

		this.start()
		this.started = false
	}

	start() {
		this.started = true
		this.score = 0
		this.died = false

		this.objects = {
			chicken: {},
			fence: {},
			ground: {}
		}
		this.world = new SpatialHash(canvasWidth, canvasHeight, canvasWidth)
		this.objects["chicken"][0] = new RubberChicken(this.world, 0, 0)
		this.chicken = this.objects["chicken"][0]
		this.objects["ground"][0] = new Ground(this.world, 0, canvasHeight-200)

		this.timer = 1
		this.speed = 1
	}

	update(dt) {
		if (this.started != true) {
			return true
		}

		this.speed += 0.01*dt

		this.timer -= this.speed*dt
		if (this.timer < 0) {
			let type = "normal"
			if (this.score > 40) {
				if (Math.random() > 0.95) {
					type = "fly"
				}
			}
			this.spawnObject("fence", new Fence(this.world, this.chicken.x+1000, canvasHeight-200-30, type))
			this.timer = Math.random()*1.8+0.8
		}

		for (const [name, objList] of Object.entries(this.objects)) {
			for (const [id, obj] of Object.entries(objList)) {
				if (obj.update) {
					obj.update(dt)
				}
			}
		}

		let keysToDelete = []
		let fences = this.objects["fence"]
		for (const [id, obj] of Object.entries(fences)) {
			if (obj.deleted) {
				keysToDelete.push(id);
			}
		}
		keysToDelete.forEach(key => {
			delete fences[key];
		});

		updatePhysics(this.objects, this.world, dt)

		this.highscore = Math.max(this.highscore, this.score)
	}
  
	draw() {
		// Background
		DRAW.setColor(255,255,255,1.0)
		DRAW.image(this.img.background, null, 172, 38, 0, 2, 2)
		
		let cameraX = this.chicken.x-270

		for (const [id, obj] of Object.entries(this.objects["fence"])) {
			obj.draw(cameraX)
		}

		this.objects["chicken"][0].draw(cameraX)

		// Arcade Cabinet overlay
		DRAW.setColor(255,255,255,1.0)
		DRAW.image(this.img.arcadeCabinet)

		// Score
		DRAW.setColor(0,0,0,1.0)
		DRAW.setFont(FONT.big)
		DRAW.text("Highscore:" + this.highscore,600,80)
		DRAW.text("Score:" + this.score,600,110)

		// Start?
		if (this.died) {
			DRAW.text("DIED",canvasWidth/2,canvasHeight/2,"center")
			if (this.score == this.highscore) {
				DRAW.text("New Highscore!",canvasWidth/2,canvasHeight/2+100,"center")
			}
		} else if (this.started != true) {
			DRAW.text("CHICKEN RUN",canvasWidth/2,canvasHeight/2-50,"center")
			DRAW.text("Press anything to start!",canvasWidth/2,canvasHeight/2+100,"center")
		}
		
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

	addPoint() {
		this.score += 1
		if (this.score%10 == 0) {
			addNuggets(1)
		}
	}

	die() {
		this.died = true
		this.started = false
	}

	keyPress(key) {
		if (this.started != true) {
			minigame.start()
			return true
		}
		if ((key == " " || key == "Space")) {
			this.objects["chicken"][0].jump()
		}
	}

	keyRelease(key) {
		
	}

	mouseClick(button, x, y) {
		if (this.started != true) {
			minigame.start()
			return true
		}
		if ((button == 0)) {
			this.objects["chicken"][0].jump()
		}
	}
}()

RubberChicken = class extends PhysicsObject {
	constructor(spatialHash, x=0, y=0) {
		super(spatialHash,x,y)
		this.x = x
		this.y = y
		this.w = 60
		this.h = 100

		this.shape = new Shape(
			-this.w/2,-this.h/2,
			this.w/2,-this.h/2,
			this.w/2,this.h/2,
			-this.w/2,this.h/2
		)

		this.active = true
		this.static = false
		this.sx = 400
		this.sy = 0

		this.anim = new Animation(minigame.sprite.chicken)
		this.anim.playAnimation([0,1,2,3], 0.05)

		this.falling = true
	}
	jump() {
		if (this.falling != true) {
			this.sy = -1000
		}
	}
	update(dt) {
		this.anim.update(dt)
		this.sx = 400*minigame.speed
		this.sy += 3500*dt
	}
	collide(name,obj,nx,ny) {
		if (ny < 0) {
			this.sy = Math.min(this.sy, 0)
		}
		if (name == "Fence") {
			this.anim.stopAnimation(4,0)
			minigame.die()
		}
		return true
	}
	startCollide(name,obj) {
		if (name == "Ground") {
			this.falling = false
		}
	}
	stopCollide(name,obj) {
		if (name == "Ground") {
			this.falling = true
		}
	}
	draw(x) {
		DRAW.setColor(255,255,255,1.0)
		DRAW.image(IMG.shadow, null, this.x-x, canvasHeight-200, 0, 0.8,1, 0.5,0.5)

		DRAW.image(minigame.img.chicken, this.anim.getSprite(), this.x-x, this.y, 0, 1,1, 0.5,0.5)
	}
}
Ground = class extends PhysicsObject {
	constructor(spatialHash, x=0, y=0) {
		super(spatialHash,x,y)
		this.w = canvasWidth
		this.h = 600
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
		this.setPosition(minigame.chicken.x-100, this.y)
	}
	draw() {

	}
	collide() {
		return true
	}
}
Fence = class extends PhysicsObject {
	constructor(spatialHash, x=0, y=0, type="normal") {
		super(spatialHash,x,y)
		this.x = x
		this.y = y
		this.w = 20
		this.h = 80

		this.shape = new Shape(
			-this.w/2,-this.h/2,
			this.w/2,-this.h/2,
			this.w/2,this.h/2,
			-this.w/2,this.h/2
		)

		this.active = true
		this.static = false
		this.sx = 0
		this.sy = 0

		this.type = type

		this.passed = false
	}
	update(dt) {
		if (this.x < minigame.chicken.x-100) {
			this.deleted = true
		} else if (this.x < minigame.chicken.x && this.passed != true) {
			minigame.addPoint()
			this.passed = true
		}

		if (this.type == "fly") {
			if (this.x < minigame.chicken.x+500 && this.y > 200) {
				this.sy = -500
			} else {
				this.sy = 0
			}
		}
	}
	draw(x) {
		DRAW.setColor(255,255,255,1.0)

		DRAW.image(minigame.img.fence, null, this.x-x, this.y, 0, 1,1, 0.5,0.5)
	}
	collide(name) {
		if (name == "Ground") {
			return false
		}
		return true
	}
}