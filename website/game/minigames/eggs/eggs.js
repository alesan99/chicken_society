// EGGS
// 2D competitive shooter. Shoot other chickens with your eggs, OR DIE

import { MINIGAMES } from "../minigame.js"
import { DRAW, SAVEDATA } from "../../main.js"
import Notify from "../../gui/notification.js"
import { conditionsUpdate } from "../../area.js"
import { IMG, SPRITE, ANIM, FONT, SFX, loadJSON5, loadJSON, ITEMS } from "../../assets.js"
import {HEXtoRGB, RGBtoHEX, removeNuggets, addNuggets, spendNuggets, addItem, removeItem, getItemCategory, getItemData, getItem} from "../../savedata.js"
import { MENUS } from "../../menu.js"
import { OBJECTS, PLAYER, PLAYER_CONTROLLER, PHYSICSWORLD, DEBUGPHYSICS, MINIGAME } from "../../world.js"
import { NETPLAY } from "../../main.js"
import { canvasWidth, canvasHeight, RenderImage } from "../../engine/render.js"
import { Sprite, Animation } from "../../engine/sprite.js"
import Shape from "../../shape.js"
import AudioSystem from "../../engine/audio.js"
import { SpatialHash, updatePhysics, drawPhysics } from "../../physics.js"
import {PhysicsObject} from "../../objects/objects.js"

if (true) {
let EggChicken
let Wall
let EggShot
let minigame

MINIGAMES["eggs"] = new class {
	constructor() {
		
	}

	load() {
		minigame = this

		// Netplays data
		this.data = {
			x:0,
			y:0,
			sx:0,
			sy:0,
			bx:0,
			by:0,
			dead:true,
			score:SAVEDATA.highscores.eggs
		} // Your data
		this.playerData = {} // Other clients' data

		this.started = false
		this.dead = true

		// Load Assets
		this.img = {}
		this.sprite = {}
		this.img.arcadeCabinet = new RenderImage("game/minigames/eggs/arcade_cabinet.png")

		this.screenx = 172
		this.screeny = 38
		this.screenw = 680
		this.screenh = 480

		// Animation variables
		this.blinkAnim = 0

		// Objects
		this.objects = {
			chicken: {},
			wall: {},
			egg: {}
		}
		this.world = new SpatialHash(canvasWidth, canvasHeight, canvasWidth/10)

		let border = 20
		this.spawnObject("wall", new Wall(this.world, this.screenx, this.screeny, this.screenw, border))
		this.spawnObject("wall", new Wall(this.world, this.screenx, this.screeny, border, this.screenh))
		this.spawnObject("wall", new Wall(this.world, this.screenx, this.screeny+this.screenh-border, this.screenw, border))
		this.spawnObject("wall", new Wall(this.world, this.screenx+this.screenw-border, this.screeny, border, this.screenh))

		this.spawnObject("wall", new Wall(this.world, this.screenx+this.screenw*0.7, this.screeny+this.screenh*0.2, 24, this.screenh*0.6))

		this.spawnObject("wall", new Wall(this.world, this.screenx+this.screenw*0.3-24, this.screeny+this.screenh*0.2, 24, this.screenh*0.6))
		
		this.chicken = this.spawnObject("chicken", new EggChicken(this.world, this.screenx+this.screenw/2, this.screeny+this.screenh/2, true))
		this.chicken.egg = this.spawnObject("egg", new EggShot(this.world))
	}

	start() {
		this.chicken.active = true
		this.chicken.static = false
		this.chicken.dead = false
		this.dead = false
	}

	die() {
		this.chicken.dead = true
		this.chicken.active = false
		this.chicken.static = true
		this.dead = true
	}

	update(dt) {
		// Animations
		this.blinkAnim = (this.blinkAnim + dt) % 1
		if (this.dead) {
		}

		//Update all players according to recieved netplay data
		for (const [id, data] of Object.entries(this.playerData)) {
			let obj = this.objects.chicken[id]
			if (obj) {
				if (data.dead) {
					obj.active = false
					obj.olddead = true
				} else {
					obj.olddead = false
					obj.active = true
					if ((data.x != obj.oldx) || (data.y != obj.oldy)) {
						obj.x = data.x
						obj.y = data.y
						obj.oldx = data.x
						obj.oldy = data.y
					}
					obj.sx = data.sx
					obj.sy = data.sy

					let egg = obj.egg
					egg.x = data.bx
					egg.y = data.by
				}
			}
		}

		// Update all objects
		for (const [name, objList] of Object.entries(this.objects)) {
			for (const [id, obj] of Object.entries(objList)) {
				if (obj.update) {
					obj.update(dt)
				}
			}
		}

		updatePhysics(this.objects, this.world, dt)

		// Update netplay data
		if (this.chicken) {
			this.data.x = Math.floor(this.chicken.x)
			this.data.y = Math.floor(this.chicken.y)
			this.data.sx = Math.floor(this.chicken.sx)
			this.data.sy = Math.floor(this.chicken.sy)
		}

		// Delete unused fences
		// let keysToDelete = []
		// let fences = this.objects["fence"]
		// for (const [id, obj] of Object.entries(fences)) {
		// 	if (obj.DELETED) {
		// 		keysToDelete.push(id);
		// 	}
		// }
		// keysToDelete.forEach(key => {
		// 	delete fences[key];
		// });
	}
  
	draw() {
		// Background
		DRAW.setColor(255,255,255,1.0)
		DRAW.rectangle(0,0,canvasWidth,canvasHeight)

		// Arcade Cabinet overlay
		DRAW.setColor(255,255,255,1.0)
		DRAW.image(this.img.arcadeCabinet)

		// DEBUG physics
		//if (DEBUGPHYSICS) {
			drawPhysics(this.objects, this.world, 0, 0)
		//}

		// Dead / Haven't started
		if (this.dead) {
			DRAW.setFont(FONT.pixel)
			DRAW.setColor(0,0,0,1.0)
			DRAW.text("Egg Hunters",canvasWidth/2,240,"center",0,3,3)
			if (this.blinkAnim > 0.5) {
				DRAW.text("Press anything to spawn!",canvasWidth/2,420,"center",0,1,1)
			}
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
		// Spawn new chicken that doesn't do collision checks
		let obj = this.spawnObject("chicken", new EggChicken(this.world, this.screenx+this.screenw/2, this.screeny+this.screenh/2, false), id)
		obj.oldx = obj.x
		obj.oldy = obj.y
		obj.oldsx = 0
		obj.oldsy = 0
		obj.olddead = true

		obj.egg = this.spawnObject("egg", new EggShot(this.world))
	}

	removePlayer(id) {
		delete this.objects["chicken"][id].egg
		delete this.objects["chicken"][id]
	}

	keyPress(key) {
		if (this.dead) {
			this.start()
			return
		}

		if (key == "w") {
			this.die()
		}

		// CONTROL CHICKEN
		let chicken = this.objects.chicken[0]
		if (key == "ArrowUp") {
			chicken.up = true
			chicken.down = false
		}
		if (key == "ArrowDown") {
			chicken.down = true
			chicken.up = false
		}
		if (key == "ArrowLeft") {
			chicken.left = true
			chicken.right = false
		}
		if (key == "ArrowRight") {
			chicken.right = true
			chicken.left = false
		}
	}

	keyRelease(key) {
		// CONTROL CHICKEN
		if (key == "ArrowUp") {
			this.chicken.up = false
		}
		if (key == "ArrowDown") {
			this.chicken.down = false
		}
		if (key == "ArrowLeft") {
			this.chicken.left = false
		}
		if (key == "ArrowRight") {
			this.chicken.right = false
		}
	}

	mouseClick(button, x, y) {
		if (button == 0) {
			this.chicken.shoot(x, y)
		}
	}

	exit() {
	}
}()

EggChicken = class extends PhysicsObject {
	constructor(spatialHash, x=0, y=0, player) {
		super(spatialHash,x,y)
		this.x = x
		this.y = y
		this.w = 40
		this.h = 40

		this.shape = new Shape(
			-this.w/2,-this.h/2,
			this.w/2,-this.h/2,
			this.w/2,this.h/2,
			-this.w/2,this.h/2
		)

		this.dead = false

		this.active = true
		this.static = false
		this.sx = 0
		this.sy = 0
		this.gravity = false

		// player controls
		this.player = player
		this.up = false
		this.down = false
		this.left = false
		this.right = false
		this.mx = 0
		this.my = 0

		this.speed = 200

		// egg shot
		this.egg = false
	}
	startCollide(name,obj) {
	}
	stopCollide(name,obj) {
	}
	collide(name, obj) {
		return true
	}
	update(dt) {
		if (this.dead) {
			return
		}
		// Player controls
		if (this.player) {
			this.mx = 0
			this.my = 0
			if (this.up) {
				this.my = -1
			}
			if (this.down) {
				this.my = 1
			}
			if (this.left) {
				this.mx = -1
			}
			if (this.right) {
				this.mx = 1
			}
			// normalize
			let len = Math.sqrt(this.mx*this.mx + this.my*this.my)
			if (len !== 0) {
				this.mx /= len
				this.my /= len
			}
			
			let speed = this.speed
			if (this.mx !== 0 || this.my !== 0) {
				this.sx = this.mx*speed
				this.sy = this.my*speed
			} else {
				this.sx = 0
				this.sy = 0
			}
		}
	}
	draw() {
		DRAW.setColor(255,255,255,1.0)
		DRAW.rectangle(this.x-this.w/2, this.y-this.h/2, this.w, this.h)
	}
	shoot(tx, ty) {
		if (this.dead) {
			return false
		}

		if (this.egg.shot) {
			return false
		}

		let angle = Math.atan2(ty-this.y, tx-this.x)
		this.egg.shoot(this.x, this.y, angle)
	}
}
Wall = class extends PhysicsObject {
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
EggShot = class extends PhysicsObject {
	constructor(spatialHash) {
		let x = 0
		let y = 0
		super(spatialHash,x,y)
		this.x = x
		this.y = y
		this.sx = 0
		this.sy = 0
		this.w = 10
		this.h = 10

		this.shape = new Shape(
			-this.w/2,-this.h/2,
			this.w/2,-this.h/2,
			this.w/2,this.h/2,
			-this.w/2,this.h/2
		)

		this.active = true
		this.static = false
		this.gravity = false
		this.speed = 400

		this.shot = false
	}
	startCollide(name,obj) {
		if (name == "Wall") {
			this.reset()
		}
	}
	stopCollide(name,obj) {
	}
	collide(name, obj) {
		if (name == "EggChicken") {
			return false
		}
		return true
	}
	update(dt) {
	}
	draw() {
		DRAW.setColor(255,255,255,1.0)
		DRAW.rectangle(this.x-this.w/2, this.y-this.h/2, this.w, this.h)
	}
	shoot(x, y, angle) {
		this.x = x
		this.y = y
		this.sx = Math.cos(angle)*this.speed
		this.sy = Math.sin(angle)*this.speed

		this.active = true
		this.static = false

		this.shot = true
	}
	reset() {
		this.active = false
		this.static = true

		this.sx = 0
		this.sy = 0

		this.shot = false
	}
}
}