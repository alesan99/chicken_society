// Claw Machine
// Move claw to left, attempt to grab prize

import { MINIGAMES } from "../minigame.js";
import { DRAW, SAVEDATA } from "../../main.js";
import Notify from "../../gui/notification.js";
import { conditionsUpdate } from "../../area.js";
import { IMG, SPRITE, ANIM, FONT, SFX, loadJSON5, ITEMS } from "../../assets.js";
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

if (true) {
	let Claw;
	let Prize;
	let Ground;
	let minigame;

	MINIGAMES["claw"] = new class {
		constructor() {
		
		}

		load() {
			minigame = this;

			// Netplays data
			this.data = {}; // Your data
			this.playerData = {}; // Other clients' data

			this.started = false;

			// Load Assets
			this.img = {};
			this.sprite = {};
			this.img.background = new RenderImage("game/minigames/claw/background.png");
			this.img.claw = new RenderImage("game/minigames/claw/claw.png");
			this.sprite.claw = new Sprite(this.img.claw, 2,1, 150,465);
			this.img.prize = new RenderImage("game/minigames/claw/prizes.png");
			this.sprite.prizeSmall = new Sprite(this.img.prize, 4,1, 90,90, 0,0, 1,1);
			this.sprite.prizeMedium = new Sprite(this.img.prize, 3,1, 130,130, 0,91, 1,1);
			this.sprite.prizeLarge = new Sprite(this.img.prize, 2,1, 210,210, 0,222, 1,1);

			// Animation variables
			this.blinkAnim = 0;

			this.objects = {
				Claw: {},
				Prize: {},
				Ground: {}
			};
			this.world = new SpatialHash(canvasWidth,canvasHeight, 100);
			this.objects["Claw"][0] = new Claw(this.world, canvasWidth-180, -270);
			this.claw = this.objects["Claw"][0];
			this.objects["Ground"][0] = new Ground(this.world, 56, canvasHeight-100, 690, 100);
			this.objects["Ground"][1] = new Ground(this.world, 0, 0, 60, 576);
			this.objects["Ground"][2] = new Ground(this.world, canvasWidth-60, 0, 60, 576);
			this.objects["Ground"][3] = new Ground(this.world, 720, 344, 26, 136);

			// Bottom Row
			for (let i = 0; i < 4; i++) {
				let x = 150+Math.random()*500;
				let size = 1;
				let sizeRoll = Math.random()*10;
				if (sizeRoll > 9) {
					size = 3;
				} else if (sizeRoll > 5) {
					size = 2;
				}
				this.spawnObject("Prize", new Prize(this.world, x,340, size));
			}

			// Middle Row
			for (let i = 0; i < 3; i++) {
				let x = 150+Math.random()*500;
				let size = 1;
				let sizeRoll = Math.random()*10;
				if (sizeRoll > 8) {
					size = 2;
				}
				this.spawnObject("Prize", new Prize(this.world, x,250, size));
			}

			// Top Row
			for (let i = 0; i < 2; i++) {
				let x = 150+Math.random()*500;
				let size = 1;
				this.spawnObject("Prize", new Prize(this.world, x,100, size));
			}
		}

		start() {
		// Start
			this.started = true;
		}

		update(dt) {
		// Update all objects
			for (const [name, objList] of Object.entries(this.objects)) {
				for (const [id, obj] of Object.entries(objList)) {
					if (obj.update) {
						obj.update(dt);
					}
				}
			}

			updatePhysics(this.objects, this.world, dt);

		
			// Delete unused prizes
			let keysToDelete = [];
			let objList = this.objects["Prize"];
			for (const [id, obj] of Object.entries(objList)) {
				if (obj.DELETED) {
					keysToDelete.push(id);
				}
			}
			keysToDelete.forEach(key => {
				delete objList[key];
			});
		}
  
		draw() {
		// Background
			DRAW.setColor(255,255,255,1.0);
			DRAW.image(this.img.background, null, 0,0);

			// Instructions
			DRAW.setColor(0,0,0,1.0);
			DRAW.setFont(FONT.caption);
			DRAW.text("1 Nugget per play.", 100, 80);

			// Prizes
			for (const [id, obj] of Object.entries(this.objects["Prize"])) {
				obj.draw();
			}

			// Claw
			this.claw.draw();

			// DEBUG physics
			if (DEBUGPHYSICS) {
				drawPhysics(this.objects, this.world);
			}
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
		}

		removePlayer(id) {
		}

		keyPress(key) {
			if (key == " " || key == "Space" || key == "ArrowUp") {
				this.claw.startMoving();
			}
		}

		keyRelease(key) {
			if (key == " " || key == "Space" || key == "ArrowUp") {
				this.claw.stopMoving();
			}
		}

		mouseClick(button, x, y) {
			if (button == 0) {
				this.claw.startMoving();
			}
		}

		mouseRelease(button, x, y) {
			if (button == 0) {
				this.claw.stopMoving();
			}
		}


		exit() {
		}
	}();

	Claw = class extends PhysicsObject {
		constructor(spatialHash, x=0, y=0) {
			super(spatialHash,x,y);
			this.x = x;
			this.y = y;

			this.w = 40;
			this.h = 400;

			this.spawnX = this.x;
			this.spawnY = this.y;

			this.shape = new Shape(
				-this.w/2,0,
				this.w/2,0,
				this.w/2,this.h,
				-this.w/2,this.h
			);

			this.active = true;
			this.static = false;
			this.sx = 0;
			this.sy = 0;
			this.gravity = false;

			this.movable = true; // Can the player control it?
			this.moving = false;

			this.grabbing = false; // can it grab stuff?
			this.grabbed = false; // object grabbed
			this.grabTimer = 0;
			this.grabX = 0; // where was object grabbed?
			this.dropTimer = 0;

			this.targetsx = 0;
			this.targetsy = 0;

			this.setPosition(null,null);
		}
		startMoving() {
			if (this.movable && !this.moving) {
				if (spendNuggets(1)) {
					this.targetsx = -300;
					this.moving = true;
				}
			}
		}
		stopMoving() {
			if (this.moving) {
				this.targetsx = 0;
				this.movable = false;
				this.moving = false;
				this.grabTimer = 0;
				this.grabbing = true;
			}
		}
		update(dt) {
			this.x = Math.min(this.spawnX, this.x);
			if (this.targetsx != this.sx) {
				let acc = 300;
				if (this.sx > this.targetsx) {
					this.sx = Math.max(this.targetsx, this.sx-acc*dt);
				} else if (this.sx < this.targetsx) {
					this.sx = Math.min(this.targetsx, this.sx+acc*dt);
				}
			}
		
			this.y = Math.max(this.spawnY, this.y);
			if (this.targetsy != this.sy) {
				let acc = 500;
				if (this.sy > this.targetsy) {
					this.sy = Math.max(this.targetsy, this.sy-acc*dt);
				} else if (this.sx < this.targetsy) {
					this.sy = Math.min(this.targetsy, this.sy+acc*dt);
				}
			}

			if (this.grabbed) {
				let prize = this.grabbed;
				prize.x = this.x+this.grabX;
				prize.y = this.y+this.h+prize.h/2;
				prize.sy = 0;
			}

			if (!this.movable) {
				this.grabTimer += dt;
			
				if (this.grabTimer > 10) {
					this.movable = true;
					this.grabbed = false;
					this.grabTimer = 0;
					this.dropTimer = 0;
				} else if (this.grabTimer > 6.5 && this.x > this.spawnX-30) {
					this.targetsx = 0;
				} else if (this.grabTimer > 6.5) {
					this.targetsx = 200;
				} else if (this.grabTimer > 6) {
					this.targetsy = 0;
				} else if (this.grabTimer > 4) {
					this.targetsy = -150;
					this.grabbing = false;
				} else if (this.grabTimer > 3) {
					this.targetsy = 0;
				} else if (this.grabTimer > 1) {
					this.targetsy = 150;
				}

				// Will it drop the item?
				if (this.grabbed) {
					if (this.grabTimer > 4) {
						this.dropTimer += dt;
					}
					if (this.dropTimer > 0.5) {
						let roll = Math.random()*50;
						if (roll < Math.abs(this.grabX)) { // The more centered the object is, the less likely it is to drop
							this.grabbed = false;
							this.grabbing = false;
						}
						this.dropTimer -= (0.4+0.2*Math.random());
					}
				}
			}
		}
		collide(name,obj,nx,ny) {
			if (ny < 0 && this.sy > 0) {
				this.sy = 0;
			}
			if (this.grabbing && name == "Prize") {
				let upFacing = (ny == -1);
				if (upFacing) {
					this.grabbed = obj;
					this.grabbing = false;
					this.grabX = obj.x-this.x;
					return true;
				}
			}
			return true;
		}
		startCollide(name,obj) {
		}
		stopCollide(name,obj) {
		}
		draw(x) {
			DRAW.setColor(255,255,255,1.0);
			let frame = 0;
			if (this.grabbed || this.grabTimer > 4) {
				frame = 1;
			}
			DRAW.image(minigame.img.claw, minigame.sprite.claw.getFrame(frame), this.x, this.y, 0, 1,1, 0.5,0);
		}
	};
	Prize = class extends PhysicsObject {
		constructor(spatialHash, x=0, y=0, size=1) {
			super(spatialHash,x,y);

			this.sprite = minigame.sprite.prizeSmall.getFrame(0);

			this.size = size;
			this.item = false;
			let dim = 80;
			if (size == 1) {
				dim = 80;
				let frame = Math.floor(Math.random()*4);
				this.item = frame;
				this.sprite = minigame.sprite.prizeSmall.getFrame(frame);
			} else if (size == 2) {
				dim = 110;
				let frame = Math.floor(Math.random()*3);
				this.item = frame;
				this.sprite = minigame.sprite.prizeMedium.getFrame(frame);
			} else if (size == 3) {
				dim = 180;
				let frame = Math.floor(Math.random()*2);
				this.item = frame;
				this.sprite = minigame.sprite.prizeLarge.getFrame(frame);
			}

			this.w = dim;
			this.h = dim;
			this.x = x;
			this.y = y;

			let bevel = 20;
			this.shape = new Shape(
				-this.w/2, -this.h/2+bevel,
				-this.w/2+bevel, -this.h/2,
				this.w/2-bevel, -this.h/2,
				this.w/2, -this.h/2+bevel,
				this.w/2, this.h/2-bevel,
				this.w/2-bevel, this.h/2,
				-this.w/2+bevel, this.h/2,
				-this.w/2, this.h/2-bevel
			);

			this.rotation = 0;
		
			this.gravity = 400;
			this.collected = false;

			this.active = true;
			this.static = false;
			this.setPosition(null,null);
		}
		update(dt) {
		// Fell
			if (!this.collected && this.y-this.h/2 > canvasHeight) {
				this.collect();
			}
		}
		collect() {
			if (this.size == 1) {
				addNuggets(5);
			} else if (this.size == 2) {
				addNuggets(8);
			} else if (this.size == 3) {
				addNuggets(15);
			}
			this.collected = true;
			this.destroy();
		}
		draw() {
			DRAW.setColor(255,255,255,1.0);
			DRAW.image(minigame.img.prize, this.sprite, this.x, this.y, this.rotation, 1,1, 0.5,0.5);
		//DRAW.setColor(200,150,0,1.0)
		//DRAW.circle(this.x,this.y, this.w/2, "fill")
		}
		collide(name,obj,nx,ny) {
			if (ny < 0 && this.sy > 0) {
			// Decelerate when hitting a slope surface below
				if (nx === 0) {
				// Set sy to 0 when the normal is 0,-1 (vertical surface)
					this.sy = 0;
				} else {
				// Adjust sy accordingly with slope physics when the normal is not horizontal
					this.sy = Math.min(this.sy, this.gravity*Math.abs(nx));
				}
			}
			return true;
		}
	};
	Ground = class extends PhysicsObject {
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
}