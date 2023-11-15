// TODO: Improve this code and comment it

let RubberChicken
let Fence
let Ground
let minigame

MINIGAMES["runner"] = new class {
	constructor() {
		
	}

	load() {
		minigame = this

		// Netplays data
		this.data = {x:0, y:0, sx:0, sy:0, dead:false} // Your data
		this.playerData = {} // Other clients' data

		this.started = false
		this.highscore = SAVEDATA.highscores.runner

		this.img = {}
		this.sprite = {}
		this.img.chicken = new RenderImage("game/minigames/runner/rubberchicken.png")
		this.sprite.chicken = new Sprite(this.img.chicken, 5,1, 96,128)
		this.img.arcadeCabinet = new RenderImage("game/minigames/runner/arcade_cabinet.png")
		this.img.fence = new RenderImage("game/minigames/runner/fence.png")
		this.sprite.fence = new Sprite(this.img.fence, 3,1, 50,92)
		this.img.background = new RenderImage("game/minigames/runner/background.png")

		this.blinkAnim = 0
		this.scoreAnim = 0
		this.deadAnim = 0

		this.start()
		this.started = false
	}

	start() {
		this.started = true
		this.score = 0
		this.died = false
		this.data.dead = false

		this.objects = {
			chicken: {},
			fence: {},
			ground: {}
		}
		this.world = new SpatialHash(canvasWidth, canvasHeight, canvasWidth)
		this.objects["chicken"][0] = new RubberChicken(this.world, 0, canvasHeight-200-80)
		this.chicken = this.objects["chicken"][0]
		this.objects["ground"][0] = new Ground(this.world, 0, canvasHeight-200)

		this.timer = 1
		this.backgroundScroll = 0
		this.speed = 1
	}

	update(dt) {
		this.blinkAnim = (this.blinkAnim + dt) % 1
		this.scoreAnim = Math.max(0, this.scoreAnim - 7*dt)
		if (this.died) {
			this.deadAnim = (this.deadAnim + 3*dt) % (Math.PI*2)
		}

		if (this.started != true) {
			return true
		}

		this.speed += 0.01*dt
		this.backgroundScroll = (this.backgroundScroll + this.chicken.sx*1.2*dt)%680

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

		// Update netplay data
		this.data.x = this.chicken.x
		this.data.y = this.chicken.y
		this.data.sx = this.chicken.sx
		this.data.sy = this.chicken.sy

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
		DRAW.image(this.img.background, [0,0,680,340], 172, 38)
		DRAW.image(this.img.background, [0,340,680,480-340], 172-this.backgroundScroll, 38+340)
		DRAW.image(this.img.background, [0,340,680,480-340], 172+680-this.backgroundScroll, 38+340)
		
		let cameraX = this.chicken.x-270

		for (const [id, obj] of Object.entries(this.objects["fence"])) {
			obj.draw(cameraX)
		}

		this.chicken.draw(cameraX)

		// Other players
		DRAW.setColor(255,255,255,0.5)
		for (const [id, data] of Object.entries(this.playerData)) {
			let frame = 0
			if (data.dead) {
				frame = 4
			}
			DRAW.image(minigame.img.chicken, this.sprite.chicken.getFrame(frame), data.x-cameraX, data.y, 0, 1,1, 0.5,0.5)
			
			DRAW.setFont(FONT.pixel)
			DRAW.text(NETPLAY.playerList[id].name, data.x-cameraX, data.y-80, "center")
		}

		// Arcade Cabinet overlay
		DRAW.setColor(255,255,255,1.0)
		DRAW.image(this.img.arcadeCabinet)

		// Score
		DRAW.setColor(255,255,255,1.0)
		DRAW.setFont(FONT.pixel)
		let scale = 1+easing("easeInQuad", this.scoreAnim)*0.1
		let highScale = 1
		if (this.scoreAnim > 1) {
			scale = 1+easing("easeOutCubic", (2-this.scoreAnim))*0.1
		}
		if (this.score == this.highscore) {
			highScale = scale
		}
		DRAW.text("Highscore: " + this.highscore, 620,80, "left", 0, highScale,highScale)
		DRAW.text("Score: " + this.score, 620,110, "left", 0, scale,scale)

		// Start?
		DRAW.setFont(FONT.pixel)
		if (this.died) {
			DRAW.setColor(0,0,0,1.0)
			DRAW.text("DIED",canvasWidth/2-4,canvasHeight/2,"center",Math.sin(this.deadAnim)*0.2,2,2)
			DRAW.text("DIED",canvasWidth/2+4,canvasHeight/2,"center",Math.sin(this.deadAnim)*0.2,2,2)
			DRAW.text("DIED",canvasWidth/2,canvasHeight/2-4,"center",Math.sin(this.deadAnim)*0.2,2,2)
			DRAW.text("DIED",canvasWidth/2,canvasHeight/2+4,"center",Math.sin(this.deadAnim)*0.2,2,2)
			if (this.score == this.highscore) {
				DRAW.text("New Highscore!",canvasWidth/2,canvasHeight/2+100,"center",0,2,2)
			}
			DRAW.setColor(255,255,255,1.0)
			DRAW.text("DIED",canvasWidth/2,canvasHeight/2,"center",Math.sin(this.deadAnim)*0.2,2,2)
		} else if (this.started != true) {
			DRAW.setColor(0,0,0,1.0)
			DRAW.text("CHICKEN RUN",canvasWidth/2-4,canvasHeight/2-50,"center",0,3,3)
			DRAW.text("CHICKEN RUN",canvasWidth/2+4,canvasHeight/2-50,"center",0,3,3)
			DRAW.text("CHICKEN RUN",canvasWidth/2,canvasHeight/2-50-4,"center",0,3,3)
			DRAW.text("CHICKEN RUN",canvasWidth/2,canvasHeight/2-50+4,"center",0,3,3)
			if (this.blinkAnim > 0.5) {
				DRAW.text("Press anything to start!",canvasWidth/2,canvasHeight/2+100,"center",0,1,1)
			}
			DRAW.setColor(255,255,255,1.0)
			DRAW.text("CHICKEN RUN",canvasWidth/2,canvasHeight/2-50,"center",0,3,3)
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
		this.scoreAnim = 2
		if (this.score%10 == 0) {
			addNuggets(1)
		}
	}

	die() {
		this.died = true
		this.started = false
		this.data.dead = true
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

	exit() {
		SAVEDATA.highscores.runner = this.highscore
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
		this.spin = false
		this.rotation = 0
	}
	jump() {
		if (this.falling != true) {
			if (Math.random() > 0.9) {
				this.spin = true
			}
			this.sy = -1000
		}
	}
	update(dt) {
		this.anim.update(dt)
		this.sx = 400*minigame.speed
		this.sy += 3500*dt

		if (this.spin) {
			this.rotation += 20*dt
		}
	}
	collide(name,obj,nx,ny) {
		if (ny < 0) {
			this.spin = false
			this.rotation = 0
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

		DRAW.image(minigame.img.chicken, this.anim.getFrame(), this.x-x, this.y, this.rotation, 1,1, 0.5,0.5)
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
		this.h = 60

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

		this.frame = 0
		if (this.type == "normal") {
			let choice = Math.floor(Math.random()*20)
			if ((minigame.score > 20 && choice <= 1) || (minigame.score > 40 && choice <= 4)) {
				this.frame = 1
			} else if (choice == 5) {
				this.frame = 2
			}
		}

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

		DRAW.image(minigame.img.fence, minigame.sprite.fence.getFrame(this.frame), this.x-x, this.y, 0, 1,1, 0.5,0.5)
	}
	collide(name) {
		if (name == "Ground") {
			return false
		}
		return true
	}
}