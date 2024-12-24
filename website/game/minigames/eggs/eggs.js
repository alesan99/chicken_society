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
let minigame

MINIGAMES["eggs"] = new class {
	constructor() {
		
	}

	load() {
		minigame = this

		// Netplays data
		this.data = {x:0, y:0, sx:0, sy:0, duck:false, dead:false, score:SAVEDATA.highscores.runner} // Your data
		this.playerData = {} // Other clients' data

		this.started = false
		this.dead = false

		// Load Assets
		this.img = {}
		this.sprite = {}
		this.img.arcadeCabinet = new RenderImage("game/minigames/eggs/arcade_cabinet.png")

		this.screenx = 172
		this.screeny = 38
		this.screenw = 680
		this.screenh = 480

		// Animation variables
		this.objects = {
			chicken: {},
			wall: {}
		}
		this.world = new SpatialHash(canvasWidth, canvasHeight, canvasWidth/10)

		let border = 20
		this.spawnObject("wall", new Wall(this.world, this.screenx, this.screeny, this.screenw, border))
		this.spawnObject("wall", new Wall(this.world, this.screenx, this.screeny, border, this.screenh))
		this.spawnObject("wall", new Wall(this.world, this.screenx, this.screeny+this.screenh-border, this.screenw, border))
		this.spawnObject("wall", new Wall(this.world, this.screenx+this.screenw-border, this.screeny, border, this.screenh))
	
		this.spawnObject("chicken", new EggChicken(this.world, this.screenx+this.screenw/2, this.screeny+this.screenh/2))
	}

	start() {
	}

	update(dt) {
		// Text animations

		// Update all players according to recieved netplay data
		// for (const [id, data] of Object.entries(this.playerData)) {
		// 	let obj = this.objects.chicken[id]
		// 	if (obj) {
		// 		if ((data.x != obj.oldx) || (data.y != obj.oldy) || (data.sx != obj.oldsx) || (data.sy != obj.oldsy)) {
		// 			obj.x = data.x
		// 			obj.y = data.y
		// 			obj.sx = data.sx
		// 			obj.sy = data.sy
		// 		}
		// 	}
		// }

		// DONT update anything else if game hasn't started
		if (this.started == true) {
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
		// this.data.x = Math.floor(this.chicken.x)
		// this.data.y = Math.floor(this.chicken.y)
		// this.data.sx = Math.floor(this.chicken.sx)
		// this.data.sy = Math.floor(this.chicken.sy)

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

	keyPress(key) {
		// CONTROL CHICKEN
		let chicken = this.objects.chicken[0]
		if (key == "ArrowUp") {
			chicken.up = true
		}
		if (key == "ArrowDown") {
			chicken.down = true
		}
		if (key == "ArrowLeft") {
			chicken.left = true
		}
		if (key == "ArrowRight") {
			chicken.right = true
		}
	}

	keyRelease(key) {
		// CONTROL CHICKEN
		let chicken = this.objects.chicken[0]
		if (key == "ArrowUp") {
			chicken.up = false
		}
		if (key == "ArrowDown") {
			chicken.down = false
		}
		if (key == "ArrowLeft") {
			chicken.left = false
		}
		if (key == "ArrowRight") {
			chicken.right = false
		}
	}

	mouseClick(button, x, y) {
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

		this.active = true
		this.static = false
		this.sx = 0
		this.sy = 0
		this.gravity = false

		this.up = false
		this.down = false
		this.left = false
		this.right = false
		this.mx = 0
		this.my = 0

		this.speed = 200
	}
	startCollide(name,obj) {
	}
	stopCollide(name,obj) {
	}
	update(dt) {
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
	draw(x) {
		DRAW.setColor(255,255,255,1.0)
		DRAW.rectangle(this.x-this.w/2, this.y-this.h/2, this.w, this.h)
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
}