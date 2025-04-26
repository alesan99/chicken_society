// EGGS
// 2D competitive shooter. Shoot other chickens with your eggs, OR DIE

import { MINIGAMES } from "../minigame.js";
import { DRAW, SAVEDATA } from "../../main.js";
import Notify from "../../gui/notification.js";
import { conditionsUpdate } from "../../area.js";
import { IMG, SPRITE, ANIM, FONT, SFX, loadJSON5, loadJSON, ITEMS } from "../../assets.js";
import {HEXtoRGB, RGBtoHEX, removeNuggets, addNuggets, spendNuggets, addItem, removeItem, getItemCategory, getItemData, getItem} from "../../savedata.js";
import { MENUS } from "../../menu.js";
import { OBJECTS, PLAYER, PLAYER_CONTROLLER, PHYSICSWORLD, DEBUGPHYSICS, MINIGAME } from "../../world.js";
import { NETPLAY } from "../../main.js";
import { canvasWidth, canvasHeight, RenderImage } from "../../engine/render.js";
import { Sprite, Animation } from "../../engine/sprite.js";
import Shape from "../../shape.js";
import AudioSystem from "../../engine/audio.js";
import { SpatialHash, updatePhysics, drawPhysics } from "../../physics.js";
import {PhysicsObject} from "../../objects/objects.js";
import { getMousePos } from "../../engine/input.js";

if (true) {
	let EggChicken;
	let Wall;
	let EggShot;
	let minigame;

	MINIGAMES["eggs"] = new class {
		constructor() {
		
		}

		load() {
			minigame = this;

			// Netplays data
			this.data = {
				x:0,
				y:0,
				sx:0,
				sy:0,
				a:0,
				bx:0,
				by:0,
				bsx:0,
				bsy:0,
				dead:true,
				killer:false,
				score:SAVEDATA.highscores.eggs
			}; // Your data
			this.playerData = {}; // Other clients' data

			this.started = false;
			this.dead = true;

			this.spawning = false;
			this.spawnX = 0;
			this.spawnY = 0;
			this.spawnValid = false;
			this.someoneSpawning = false;

			// Load Assets
			this.img = {};
			this.sprite = {};
			this.img.arcadeCabinet = new RenderImage("game/minigames/eggs/arcade_cabinet.png");
			this.img.eggChicken = new RenderImage("game/minigames/eggs/egg_chicken.png");
			this.sprite.eggChicken = new Sprite(this.img.eggChicken, 1,1, 64,64, 0,0, 0,0);
			this.sprite.eggChickenLegs = new Sprite(this.img.eggChicken, 2,1, 32,64, 64,0, 0,0);
			this.sprite.eggShot = new Sprite(this.img.eggChicken, 1,1, 24,24, 0,64, 0,0);

			this.img.map = new RenderImage("game/minigames/eggs/map.png");

			this.screenx = 172;
			this.screeny = 38;
			this.screenw = 680;
			this.screenh = 480;

			// Animation variables
			this.blinkAnim = 0;

			// Objects
			this.objects = {
				chicken: {},
				wall: {},
				egg: {}
			};
			this.world = new SpatialHash(canvasWidth, canvasHeight, canvasWidth/10);

			let border = 20;
			this.spawnObject("wall", new Wall(this.world, this.screenx, this.screeny, this.screenw, border));
			this.spawnObject("wall", new Wall(this.world, this.screenx, this.screeny, border, this.screenh));
			this.spawnObject("wall", new Wall(this.world, this.screenx, this.screeny+this.screenh-border, this.screenw, border));
			this.spawnObject("wall", new Wall(this.world, this.screenx+this.screenw-border, this.screeny, border, this.screenh));

			this.spawnObject("wall", new Wall(this.world, this.screenx+this.screenw*0.7, this.screeny+this.screenh*0.2, 24, this.screenh*0.6));

			this.spawnObject("wall", new Wall(this.world, this.screenx+this.screenw*0.3-24, this.screeny+this.screenh*0.2, 24, this.screenh*0.6));
		
			this.chicken = this.spawnObject("chicken", new EggChicken(this.world, 0, 100, true, false));
			this.chicken.dead = true;
			this.chicken.egg = this.spawnObject("egg", new EggShot(this.world, this.chicken, false));
			this.chicken.egg.makePrimary();
		}

		start() {
			if (!this.spawning) {
				this.startSpawning();
				removeNuggets(1);
				return false;
			} else if (!this.spawnValid) {
				return false;
			}

			this.spawning = false;

			this.chicken.spawn(this.spawnX, this.spawnY);
			this.dead = false;

			this.data.killer = false;
		}

		startSpawning() {
			this.spawning = true;
			this.spawnX = this.screenx+this.screenw/2;
			this.spawnY = this.screeny+this.screenh/2;
			this.spawnValid = false;

			this.chicken.setPosition(0, 200); // Special position to let players know you're spawning
			this.chicken.sx = 0;
			this.chicken.sy = 0;
		}

		die() {
			this.dead = true;
		}

		update(dt) {
		// Animations
			this.blinkAnim = (this.blinkAnim + dt) % 1;
			if (this.dead) {
			}

			//Update all players according to recieved netplay data
			this.someoneSpawning = false;
			for (const [id, data] of Object.entries(this.playerData)) {
				let obj = this.objects.chicken[id];
				if (obj) {
					if (data.dead) {
					// Killed someone
						if (!obj.olddead) {
							if (data.killer === NETPLAY.id) {
								addNuggets(1);
							}
						}
						// Dead Chicken
						obj.active = false;
						obj.olddead = true;
						obj.sx = 0;
						obj.sy = 0;
					} else {
					// Alive Chicken
						obj.olddead = false;
						obj.active = true;
					}
					if ((data.x != obj.oldx) || (data.y != obj.oldy) || (data.sx != obj.oldsx) || (data.sy != obj.oldsy)) {
						obj.setPosition(data.x, data.y);
						obj.oldx = data.x;
						obj.oldy = data.y;
						obj.sx = data.sx;
						obj.sy = data.sy;
						obj.oldsx = data.sx;
						obj.oldsy = data.sy;
					}
					obj.angle = data.a * (Math.PI/180);

					if (data.x == 0 && data.y == 200) {
						console.log("Someone is getting ready to spawn!");
						this.someoneSpawning = true;
					}

					// Egg Shot
					let egg = obj.egg;
					if (data.bx != egg.oldx || data.by != egg.oldy || data.bsx != egg.sx || data.bsy != egg.sy) {
						egg.setPosition(data.bx, data.by);
						egg.oldx = data.bx;
						egg.oldy = data.by;
						egg.sx = data.bsx;
						egg.sy = data.bsy;
						egg.oldsx = data.bsx;
						egg.oldsy = data.bsy;
					}
					if (egg.sx != 0 || egg.sy != 0) {
						if (!egg.shot) {
							egg.shoot();
						}
					} else {
						if (egg.shot) {
							egg.reset();
						}
					}
				}
			}

			// Update all objects
			for (const [name, objList] of Object.entries(this.objects)) {
				for (const [id, obj] of Object.entries(objList)) {
					if (obj.update) {
						obj.update(dt);
					}
				}
			}

			updatePhysics(this.objects, this.world, dt);
		
			// Choose where to spawn
			if (this.spawning) {
				let [mx, my] = getMousePos();
				this.spawnX = mx;
				this.spawnY = my;
				this.spawnValid = false;

				// within screen
				if (mx > this.screenx && mx < this.screenx+this.screenw && my > this.screeny && my < this.screeny+this.screenh) {
					this.spawnValid = true;
				}
				// not touching walls
				if (this.spawnValid) {
					for (const [id, obj] of Object.entries(this.objects["wall"])) {
						if (obj.shape.checkInside(mx-obj.x, my-obj.y)) {
							this.spawnValid = false;
							break;
						}
					}
				}
				// not near other players
				if (this.spawnValid) {
					for (const [id, obj] of Object.entries(this.objects["chicken"])) {
						let dist = Math.sqrt((mx-obj.x)*(mx-obj.x) + (my-obj.y)*(my-obj.y));
						if (dist < 120) {
							this.spawnValid = false;
							break;
						}
					}
				}
			}

			// Update netplay data
			if (this.chicken) {
				this.data.dead = this.dead;
				this.data.x = Math.floor(this.chicken.x);
				this.data.y = Math.floor(this.chicken.y);
				this.data.sx = Math.floor(this.chicken.sx);
				this.data.sy = Math.floor(this.chicken.sy);
				if (!this.chicken.dead) {
					this.data.a = Math.floor(this.chicken.angle * (180/Math.PI));
				}
				this.data.bx = Math.floor(this.chicken.egg.x);
				this.data.by = Math.floor(this.chicken.egg.y);
				this.data.bsx = Math.floor(this.chicken.egg.sx);
				this.data.bsy = Math.floor(this.chicken.egg.sy);
			}
		}
  
		draw() {
		// Map
			DRAW.image(this.img.map, null, this.screenx, this.screeny);

			// Eggs
			for (const [id, obj] of Object.entries(this.objects["egg"])) {
				obj.draw();
			}

			// Chickens
			for (const [id, obj] of Object.entries(this.objects["chicken"])) {
				obj.draw();
			
				// Can't spawn regions
				if (this.spawning) {
					DRAW.setColor(128,20,0,1.0);
					DRAW.setLineWidth(3);
					DRAW.circle(obj.x, obj.y, 120, "line");
				}
			}

			// DEBUG physics
			if (DEBUGPHYSICS) {
				drawPhysics(this.objects, this.world, 0, 0);
			}

			// Dead / Haven't started
			if (this.spawning) {
				DRAW.setFont(FONT.pixel);
				DRAW.setColor(0,0,0,1.0);
				DRAW.text("Click a spot to spawn!",canvasWidth/2,100,"center",0,1,1);
				if (this.spawnValid) {
					DRAW.setColor(255,255,255,1.0);
				} else {
					DRAW.setColor(245,40,0,1.0);
				}
				DRAW.setLineWidth(3);
				DRAW.circle(this.spawnX, this.spawnY, 20, "line");
			} else if (this.dead) {
				DRAW.setFont(FONT.pixel);
				DRAW.setColor(0,0,0,1.0);
				DRAW.text("Egg Hunters",canvasWidth/2,240,"center",0,3,3);
				if (this.blinkAnim > 0.5) {
					DRAW.text("Insert x1 nugget to start!",canvasWidth/2,420,"center",0,1,1);
				}
			} else {
				if (this.someoneSpawning) {
					if (this.blinkAnim > 0.5) {
						DRAW.setFont(FONT.pixel);
						DRAW.setColor(0,0,0,1.0);
						DRAW.text("Someone is getting ready to spawn!",canvasWidth/2,100,"center",0,1,1);
					}
				}
			}

			// Arcade Cabinet overlay
			DRAW.setColor(255,255,255,1.0);
			DRAW.image(this.img.arcadeCabinet);
		}

		// Register an object as part of the physics world
		spawnObject(name, obj, id) {
			if (id === undefined) {
				id = 0;
				while (this.objects[name].hasOwnProperty(id.toString())) {
					id++;
				}
			}
			this.objects[name][id] = obj;
			return obj;
		}

		// Multiplayer
		addPlayer(id) {
		// Spawn new chicken that doesn't do collision checks
			let obj = this.spawnObject("chicken", new EggChicken(this.world, this.screenx+this.screenw/2, this.screeny+this.screenh/2, false, id), id);
			obj.olddead = true;
			obj.id = id;

			obj.egg = this.spawnObject("egg", new EggShot(this.world, obj, id), id);
			obj.egg.parent = obj;
		}

		removePlayer(id) {
			this.objects["egg"][id].destroy();
			this.objects["chicken"][id].destroy();
			delete this.objects["egg"][id];
			delete this.objects["chicken"][id];
		}

		keyPress(key) {
			if (this.dead) {
				this.start();
				return;
			}

			// CONTROL CHICKEN
			if (key == "ArrowUp" || key == "w") {
				this.chicken.up = true;
			}
			if (key == "ArrowDown" || key == "s") {
				this.chicken.down = true;
			}
			if (key == "ArrowLeft" || key == "a") {
				this.chicken.left = true;
			}
			if (key == "ArrowRight" || key == "d") {
				this.chicken.right = true;
			}
		
			if (key == " " || key == "Space") {
				this.chicken.shoot(null, null);
			}
		}

		keyRelease(key) {
		// CONTROL CHICKEN
			if (key == "ArrowUp" || key == "w") {
				this.chicken.up = false;
			}
			if (key == "ArrowDown" || key == "s") {
				this.chicken.down = false;
			}
			if (key == "ArrowLeft" || key == "a") {
				this.chicken.left = false;
			}
			if (key == "ArrowRight" || key == "d") {
				this.chicken.right = false;
			}
		}

		mouseClick(button, x, y) {
			if (this.dead) {
				this.start();
				return;
			}

			if (this.dead) {
				return;
			}

			if (button == 0) {
				this.chicken.shoot(x, y);
			}
		}

		exit() {
		}
	}();

	EggChicken = class extends PhysicsObject {
		constructor(spatialHash, x=0, y=0, player, id) {
			super(spatialHash,x,y);
			this.x = x;
			this.y = y;
			this.oldx = x;
			this.oldy = y;
			this.w = 40;
			this.h = 40;

			this.shape = new Shape(
				-this.w/2,-this.h/2,
				this.w/2,-this.h/2,
				this.w/2,this.h/2,
				-this.w/2,this.h/2
			);

			this.dead = false;

			this.active = true;
			this.static = false;
			this.sx = 0;
			this.sy = 0;
			this.oldsx = this.sx;
			this.oldsy = this.sy;
			this.gravity = false;

			// player controls
			this.player = player;
			this.up = false;
			this.down = false;
			this.left = false;
			this.right = false;
			this.mx = 0;
			this.my = 0;

			this.speed = 200;

			// Image
			this.img = minigame.img.eggChicken;
			this.sprite = minigame.sprite.eggChicken;
			this.legSprite = minigame.sprite.eggChickenLegs;

			this.angle = 0;
			this.walkAnim = 0;

			this.id = id;

			// egg shot
			this.egg = false;
		}
		startCollide(name,obj) {
		}
		stopCollide(name,obj) {
		}
		collide(name, obj) {
			if (name == "EggShot") {
				if (this.player && obj.parent != this) {
					this.die(obj.id);
					return false;
				}
			}
			return true;
		}
		spawn(x, y) {
			this.setPosition(x, y);
			this.active = true;
			this.static = false;
			this.dead = false;
			this.sx = 0;
			this.sy = 0;
		}
		die(id) {
			if (this.dead) {
				return;
			}
			minigame.data.killer = id;
			this.setPosition(0, 100);
			this.dead = true;
			this.active = false;
			this.static = true;
			this.sx = 0;
			this.sy = 0;
			minigame.die();
		}
		update(dt) {
			if (this.dead) {
				return;
			}
			// Update angle
			if (this.player) {
				let [mx, my] = getMousePos();
				this.angle = Math.atan2(my-this.y, mx-this.x) + Math.PI/2;
			}

			// Player controls
			if (this.player) {
				this.mx = 0;
				this.my = 0;
				if (this.up) {
					this.my = -1;
				}
				if (this.down) {
					this.my = 1;
				}
				if (this.left) {
					this.mx = -1;
				}
				if (this.right) {
					this.mx = 1;
				}
				// normalize
				let len = Math.sqrt(this.mx*this.mx + this.my*this.my);
				if (len !== 0) {
					this.mx /= len;
					this.my /= len;
				}
			
				let speed = this.speed;
				if (this.mx !== 0 || this.my !== 0) {
					this.sx = this.mx*speed;
					this.sy = this.my*speed;
				} else {
					this.sx = 0;
					this.sy = 0;
				}
			}

			if (this.sx !== 0 || this.sy !== 0) {
				this.walkAnim = (this.walkAnim + dt*3) % 1;
			}
		}
		draw() {
			if (this.dead) {
				return;
			}

			DRAW.setColor(255,255,255,1.0);
			// Legs
			if (this.sx !== 0 || this.sy !== 0) {
				let legS1 = this.legSprite.getFrame(0,0);
				let legS2 = this.legSprite.getFrame(1,0);
				if (this.walkAnim < 0.5) {
					legS1 = this.legSprite.getFrame(1,0);
					legS2 = this.legSprite.getFrame(0,0);
				}
				DRAW.image(this.img, legS1, this.x, this.y, this.angle, 1,1, 1,0.5-Math.sin(this.walkAnim*Math.PI*2)*0.3);
				DRAW.image(this.img, legS2, this.x, this.y, this.angle, 1,1, 0,0.5+Math.sin(this.walkAnim*Math.PI*2)*0.3);
			}
			// Chicken
			DRAW.image(this.img, this.sprite.getFrame(0,0), this.x, this.y, this.angle, 1,1, 0.5,0.5);
			// Name
			if (this.id !== false) {
				DRAW.setFont(FONT.pixel);
				DRAW.setColor(0,0,0,1.0);
				DRAW.text(NETPLAY.playerList[this.id].name, this.x, this.y-40, "center", 0, 0.5,0.5);
			}
		}
		shoot(tx, ty) {
			if (this.dead) {
				return false;
			}

			if (this.egg.shot) {
				return false;
			}

			if (tx === null || ty === null) {
				this.egg.shoot(this.x, this.y, this.angle-Math.PI/2);
			} else {
				let angle = Math.atan2(ty-this.y, tx-this.x);
				this.egg.shoot(this.x, this.y, angle);
			}
		}
	};
	Wall = class extends PhysicsObject {
		constructor(spatialHash, x=0, y=0, w, h) {
			super(spatialHash,x,y);
			this.w = w;
			this.h = h;
			this.x = x;
			this.y = y;

			this.shape = new Shape(
				0,0,
				this.w,0,
				this.w,this.h,
				0,this.h
			);

			this.active = true;
			this.static = true;
			this.setPosition(null,null);
		}
		update(dt) {
		}
		draw() {

		}
		collide() {
			return true;
		}
	};
	EggShot = class extends PhysicsObject {
		constructor(spatialHash, parent, id) {
			let x = 0;
			let y = 0;
			super(spatialHash,x,y);
			this.x = x;
			this.y = y;
			this.oldx = x;
			this.oldy = y;
			this.sx = 0;
			this.sy = 0;
			this.w = 20;
			this.h = 20;

			this.shape = new Shape(
				-this.w/2,-this.h/2,
				this.w/2,-this.h/2,
				this.w/2,this.h/2,
				-this.w/2,this.h/2
			);

			this.active = true;
			this.static = false;
			this.gravity = false;
			this.speed = 400;

			this.parent = parent;

			this.primary = false;

			// Graphics
			this.img = minigame.img.eggChicken;
			this.sprite = minigame.sprite.eggShot;

			this.id = id;

			this.reset();
		}
		makePrimary() {
			this.primary = true;
		}
		startCollide(name,obj) {
		}
		stopCollide(name,obj) {
		}
		collide(name, obj) {
			if (!this.primary) {
				return false;
			}

			if (!this.shot) {
				return false;
			}

			if (name == "Wall") {
				this.reset();
				return false;
			}

			if (name == "EggChicken") {
				if (obj == this.parent) {
					return false;
				}
				this.reset();
				return true;
			}
			return true;
		}
		update(dt) {
		}
		draw() {
			if (!this.shot) {
				return;
			}
			DRAW.setColor(255,255,255,1.0);
			DRAW.image(this.img, this.sprite.getFrame(0,0), this.x, this.y, 0, 1,1, 0.5,0.5);
		}
		shoot(x, y, angle) {
			if (this.shot) {
				return;
			}

			if (x !== null && y !== null) {
				this.setPosition(x,y);
				this.sx = Math.cos(angle)*this.speed;
				this.sy = Math.sin(angle)*this.speed;
			}

			this.active = true;
			this.static = false;

			this.shot = true;
		}
		reset() {
			this.setPosition(0,0);

			if (!this.shot) {
				return false;
			}

			this.active = false;
			this.static = true;

			this.sx = 0;
			this.sy = 0;

			this.shot = false;

			return true;
		}
	};
}