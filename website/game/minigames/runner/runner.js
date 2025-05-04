// CHICKEN RUN
// Control a chicken running to the right, jump over obstacles while the chicken slowly speeds up.

import { MINIGAMES } from "../minigame.js";
import { SAVEDATA } from "../../main.js";
import { Draw } from "../../engine/canvas.js";
import Notify from "../../gui/notification.js";
import { IMG, SPRITE, ANIM, FONT, SFX, loadJSON5, loadJSON, ITEMS, MUSIC } from "../../assets.js";
import {HEXtoRGB, RGBtoHEX, removeNuggets, addNuggets, spendNuggets, addItem, removeItem, getItemCategory, getItemData, getItem} from "../../savedata.js";
import { DEBUGPHYSICS, MINIGAME } from "../../world.js";
import { NETPLAY } from "../../main.js";
import { RenderImage } from "../../engine/render.js";
import { canvasWidth, canvasHeight } from "../../engine/canvas.js";
import { Sprite, Animation } from "../../engine/sprite.js";
import Shape from "../../shape.js";
import AudioSystem from "../../engine/audio.js";
import { SpatialHash, updatePhysics, drawPhysics } from "../../physics.js";
import {PhysicsObject} from "../../objects/objects.js";
import { Button } from "../../gui/gui.js";

if (true) {
	let RubberChicken;
	let Fence;
	let Ground;
	let minigame;

	MINIGAMES["runner"] = new class {
		constructor() {
		
		}

		load() {
			minigame = this;

			// Netplays data
			this.data = {x:0, y:0, sx:0, sy:0, duck:false, dead:false, score:SAVEDATA.highscores.runner}; // Your data
			this.playerData = {}; // Other clients' data

			this.started = false;
			this.dead = false;

			this.score = 0;
			this.highscore = SAVEDATA.highscores.runner;
			this.highscores = [[0,"---"],[0,"---"],[0,"---"]];

			this.timer = 1;
			this.backgroundScroll = 0;
			this.speed = 1;

			// Load Assets
			this.img = {};
			this.sprite = {};
			this.img.chicken = new RenderImage("game/minigames/runner/rubberchicken.png");
			this.sprite.chicken = new Sprite(this.img.chicken, 8,1, 128,128);
			this.img.shadow = new RenderImage("game/minigames/runner/shadow.png");
			this.img.arcadeCabinet = new RenderImage("game/minigames/runner/arcade_cabinet.png");
			this.img.fence = new RenderImage("game/minigames/runner/fence.png");
			this.sprite.fence = new Sprite(this.img.fence, 4,1, 64,160);
			this.img.background = new RenderImage("game/minigames/runner/background.png");
			this.img.buttons = new RenderImage("game/minigames/runner/buttons.png");
			this.sprite.buttons = new Sprite(this.img.buttons, 3,1, 100,100);

			// On-screen controls
			this.buttons = {};
			this.buttons.jump = new Button("", () => {this.keyPress(" ");}, {image:this.img.buttons, frames:[this.sprite.buttons.getFrame(0,0),this.sprite.buttons.getFrame(1,0),this.sprite.buttons.getFrame(2,0)]}, canvasWidth-40-100,canvasHeight-290, 100,80);
			this.buttons.jump.actionOnClick = true;
			this.buttons.duck = new Button("", () => {this.keyPress("Shift");}, {image:this.img.buttons, rotation:Math.PI, frames:[this.sprite.buttons.getFrame(0,0),this.sprite.buttons.getFrame(1,0),this.sprite.buttons.getFrame(2,0)]}, canvasWidth-40-100,canvasHeight-180, 100,80);
			this.buttons.duck.actionOnClick = true;

			// Animation variables
			this.blinkAnim = 0;
			this.scoreAnim = 0;
			this.deadAnim = 0;

			this.objects = {
				chicken: {},
				fence: {},
				ground: {}
			};
			this.world = new SpatialHash(canvasWidth, canvasHeight, canvasWidth);
			this.objects["chicken"][0] = new RubberChicken(this.world, 0, canvasHeight-200-60, "player");
			this.chicken = this.objects["chicken"][0];
			this.objects["ground"][0] = new Ground(this.world, 0, canvasHeight-200);
		}

		start() {
			// Start Running!
			this.started = true;
			this.dead = false;
			this.data.dead = false;
			this.score = 0;
			this.runningTime = 0;
			this.musicUpdateTimer = 0;

			// Reset player
			this.chicken.dead = false;
			this.chicken.x = 0;
			this.chicken.y = canvasHeight-200-60;
			this.chicken.startRunning();

			// delete all fences
			for (const [id, obj] of Object.entries(this.objects["fence"])) {
				obj.destroy();
			}

			this.timer = 1;
			this.backgroundScroll = 0;
			this.speed = 1;
			AudioSystem.playMusic(MUSIC.thefunnychicken);
		}

		die() {
			this.dead = true;
			this.data.score = this.highscore;
			this.started = false;
			this.data.dead = true;
			AudioSystem.stopMusic();
			AudioSystem.playSound(SFX.cluck[3]);
		}

		update(dt) {
			// Text animations
			this.blinkAnim = (this.blinkAnim + dt) % 1;
			this.scoreAnim = Math.max(0, this.scoreAnim - 7*dt);
			if (this.dead) {
				this.deadAnim = (this.deadAnim + 3*dt) % (Math.PI*2);
			}

			// Update all players according to recieved netplay data
			for (const [id, data] of Object.entries(this.playerData)) {
				let obj = this.objects.chicken[id];
				if (obj) {
					if ((data.x != obj.oldx) || (data.y != obj.oldy) || (data.sx != obj.oldsx) || (data.sy != obj.oldsy) || (data.duck != obj.oldduck)) {
						obj.x = data.x;
						obj.y = data.y;
						obj.sx = data.sx;
						obj.sy = data.sy;
						obj.oldx = data.x;
						obj.oldy = data.y;
						obj.oldsx = data.sx;
						obj.oldsy = data.sy;
						obj.oldduck = data.duck;
						if (data.duck) {
							obj.duck();
						} else if (!data.duck) {
							obj.unduck();
						}
						if (data.dead && (!obj.dead)) {
							obj.anim.stopAnimation(7,0);
						} else if ((!data.dead) && (obj.dead)) {
							obj.startRunning();
						}
						obj.dead = data.dead;
					}
				}
			}

			// DONT update anything else if game hasn't started
			if (this.started == true) {
				// Speed chicken up slowly and loop background
				this.speed += 0.01*dt;
				this.backgroundScroll = (this.backgroundScroll + this.chicken.sx*1.2*dt)%680;

				// Spawn fences
				this.timer -= this.speed*dt;
				if (this.timer < 0) {
					let type = "normal";
					if (this.score > 30) {
						if (Math.random() > 0.7) {
							type = "sign";
						}
					} else if (this.score > 10) {
						if (Math.random() > 0.8) {
							type = "sign";
						}
					}
					if (this.score > 40) {
						if (Math.random() > 0.95) {
							type = "fly";
						}
					}
					this.spawnObject("fence", new Fence(this.world, this.chicken.x+1000, canvasHeight-200-30, type));
					this.timer = Math.random()*1.8+0.8;
				}

				// Speed up the music the longer you run
				this.runningTime += dt;
				this.musicUpdateTimer += dt;
				if (this.musicUpdateTimer > 3) {
					AudioSystem.setMusicSpeed(1.0 + this.runningTime/(60*15));
					this.musicUpdateTimer = 0;
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

			// Update netplay data
			this.data.x = Math.floor(this.chicken.x);
			this.data.y = Math.floor(this.chicken.y);
			this.data.sx = Math.floor(this.chicken.sx);
			this.data.sy = Math.floor(this.chicken.sy);
			this.data.duck = this.chicken.ducking;

			// Delete unused fences
			let keysToDelete = [];
			let fences = this.objects["fence"];
			for (const [id, obj] of Object.entries(fences)) {
				if (obj.DELETED) {
					keysToDelete.push(id);
				}
			}
			keysToDelete.forEach(key => {
				delete fences[key];
			});

			// On-screen controls
			for (const [name, button] of Object.entries(this.buttons)) {
				button.update(dt);
			}
		}
  
		draw() {
			// Background
			Draw.setColor(255,255,255,1.0);
			Draw.image(this.img.background, [0,0,680,340], 172, 38);
			Draw.image(this.img.background, [0,340,680,480-340], 172-this.backgroundScroll, 38+340);
			Draw.image(this.img.background, [0,340,680,480-340], 172+680-this.backgroundScroll, 38+340);
		
			let cameraX = this.chicken.x-270;

			for (const [id, obj] of Object.entries(this.objects["fence"])) {
				obj.draw(cameraX);
			}

			// Render all chickens
			Draw.setColor(255,255,255,0.5);
			Draw.setFont(FONT.pixel);
			let offscreenRight = 0;
			let offscreenLeft = 0;
			for (const [id, obj] of Object.entries(this.objects["chicken"])) {
				if (obj != this.chicken) { // Except player, they should be drawn last
				// Chicken
					obj.draw(cameraX);
					// Nametag
					let textWidth = Draw.getTextWidth(NETPLAY.playerList[id].name)*0.75;
					let chickenX = obj.x-cameraX;
					let nameTagX = Math.max(172+textWidth/2, Math.min(852-textWidth/2, chickenX));
					if (chickenX != nameTagX) { // Show distance if off-screen
						let dist = Math.floor((obj.x-this.chicken.x)/100);
						let nameTagY = obj.y-57;
						if (obj.y > canvasHeight-200-60) {
							if (dist < 0) {
								nameTagY += offscreenLeft*23;
								offscreenLeft += 1;
							} else {
								nameTagY += offscreenRight*23;
								offscreenRight += 1;
							}
						}
						Draw.text(NETPLAY.playerList[id].name, nameTagX, nameTagY, "center", 0, 0.75,0.75);
						Draw.text(`${dist}m`, nameTagX, nameTagY+12, "center", 0, 0.75,0.75);
					} else {
						Draw.text(NETPLAY.playerList[id].name, nameTagX, obj.y-70, "center", 0, 0.75,0.75);
					}
				}
			}
		
			Draw.setColor(255,255,255,1);
			this.chicken.draw(cameraX); // Your chicken

			// Arcade Cabinet overlay
			Draw.setColor(255,255,255,1.0);
			Draw.image(this.img.arcadeCabinet);

			// Score
			Draw.setColor(255,255,255,1.0);
			Draw.setFont(FONT.pixel);
			let scale = 1+easing("easeInQuad", this.scoreAnim)*0.1;
			let highScale = 1;
			if (this.scoreAnim > 1) {
				scale = 1+easing("easeOutCubic", (2-this.scoreAnim))*0.1;
			}
			if (this.score == this.highscore) {
				highScale = scale;
			}
			Draw.text("Highscore: " + this.highscore, 590,95, "left", 0, highScale,highScale);
			Draw.text("Score: " + this.score, 590,120, "left", 0, scale,scale);

			// Start?
			Draw.setFont(FONT.pixel);
			if (this.dead) {
				Draw.setColor(0,0,0,1.0);
				Draw.text("DIED",canvasWidth/2-4,240,"center",Math.sin(this.deadAnim)*0.2,2,2);
				Draw.text("DIED",canvasWidth/2+4,240,"center",Math.sin(this.deadAnim)*0.2,2,2);
				Draw.text("DIED",canvasWidth/2,240-4,"center",Math.sin(this.deadAnim)*0.2,2,2);
				Draw.text("DIED",canvasWidth/2,240+4,"center",Math.sin(this.deadAnim)*0.2,2,2);
				Draw.setColor(255,255,255,1.0);
				Draw.text("DIED",canvasWidth/2,240,"center",Math.sin(this.deadAnim)*0.2,2,2);
				if (this.score == this.highscore) {
					Draw.text("New Highscore!",canvasWidth/2,canvasHeight/2+130,"center",0,2,2);
				}
			} else if (this.started != true) {
				Draw.setColor(0,0,0,1.0);
				Draw.text("CHICKEN RUN",canvasWidth/2-4,240,"center",0,3,3);
				Draw.text("CHICKEN RUN",canvasWidth/2+4,240,"center",0,3,3);
				Draw.text("CHICKEN RUN",canvasWidth/2,240-4,"center",0,3,3);
				Draw.text("CHICKEN RUN",canvasWidth/2,240+4,"center",0,3,3);
				Draw.setColor(255,255,255,1.0);
				Draw.text("CHICKEN RUN",canvasWidth/2,240,"center",0,3,3);
				if (this.blinkAnim > 0.5) {
					Draw.text("Press anything to start!",canvasWidth/2,420,"center",0,1,1);
				}

			
				Draw.text("Jump: Space or left click",200,480,"left",0,1,1);
				Draw.text("Duck: Shift or right click",200,500,"left",0,1,1);
			}
			// Leaderboard
			if (this.started != true) {
				Draw.setColor(255,255,255,1.0);
				Draw.text("Leaderboard", canvasWidth/2-140, 295, "left");
				for (let i = 0; i < this.highscores.length; i++) {
					let highscore = this.highscores[i][0];
					let name = this.highscores[i][1];
					Draw.text(name + " - " + highscore, canvasWidth/2-140, 320 + i * 25, "left");
				}
			}

			// On-screen controls
			for (const [name, button] of Object.entries(this.buttons)) {
				button.draw();
			}

			// DEBUG physics
			if (DEBUGPHYSICS) {
				drawPhysics(Draw, this.objects, this.world, -cameraX, 0);
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

		addPoint() {
			this.score += 1;
			this.scoreAnim = 2;
			if (this.score%10 == 0) {
				addNuggets(2);
			}

			// Update highscore
			if (this.score > this.highscore) {
				this.highscore = this.score;
				MINIGAME.newHighscore(this.score);
			}
		}

		// Multiplayer
		addPlayer(id) {
		// Spawn new chicken that doesn't do collision checks
			let obj = new RubberChicken(this.world, 0, canvasHeight-200-80, false);
			this.objects["chicken"][id] = obj;
			obj.oldx = obj.x;
			obj.oldy = obj.y;
			obj.oldsx = 0;
			obj.oldsy = 0;
			obj.startRunning();
		}

		removePlayer(id) {
			delete this.objects["chicken"][id];
		}

		keyPress(key) {
			if (this.started != true) {
				minigame.start();
				return true;
			}

			if (key == " " || key == "Space" || key == "ArrowUp") {
				this.chicken.jump();
			} else if (key == "Shift" || key == "ShiftLeft" || key == "ArrowDown") {
				this.chicken.duck();
			}
		}

		keyRelease(key) {
		
		}

		mouseClick(button, x, y) {
			for (const [name, btn] of Object.entries(this.buttons)) {
				if (btn.click(button, x, y)) {
					return true;
				}
			}
			if (this.started != true) {
				minigame.start();
				return true;
			}
			if (button == 0) {
				this.chicken.jump();
			} else if (button == 2) {
				this.chicken.duck();
			}
		}

		mouseRelease(button, x, y) {
			for (const [name, btn] of Object.entries(this.buttons)) {
				if (btn.clickRelease(button, x, y)) {
					return true;
				}
			}
		}

		exit() {
			SAVEDATA.highscores.runner = this.highscore;
		}
	}();

	RubberChicken = class extends PhysicsObject {
		constructor(spatialHash, x=0, y=0, player) {
			super(spatialHash,x,y);
			this.x = x;
			this.y = y;
			this.w = 60;
			this.h = 100;

			this.runShape = new Shape(
				-this.w/2,-this.h/2,
				this.w/2,-this.h/2,
				this.w/2,this.h/2,
				-this.w/2,this.h/2
			);
			this.duckShape = new Shape(
				-this.w/2,-this.h/4,
				this.w/2,-this.h/4,
				this.w/2,this.h/4,
				-this.w/2,this.h/4
			);
			this.shape = this.runShape;

			this.active = true;
			this.static = false;
			this.sx = 0;
			this.sy = 0;
			this.gravity = false;

			this.player = player; // Is this the main player? i.e. not a ghost

			this.dead = false;

			this.anim = new Animation(minigame.sprite.chicken);

			this.ducking = false;
			this.duckTimer = 0;

			this.falling = true;
			this.spin = false;
			this.rotation = 0;
		}
		startRunning() {
			this.static = false;
			this.sx = 400;
			if (this.player) {
				this.gravity = 3500;
			}
			this.anim.playAnimation([0,1,2,3], 0.05);
		}
		jump() {
			if (this.falling != true) {
				if (Math.random() > 0.9) {
					this.spin = true;
				}
				this.sy = -1000;
				this.unduck();
			}
		}
		duck() {
		// Slam onto the ground and get small
			if (!this.ducking) {
				this.ducking = true;
				this.shape = this.duckShape;
				this.anim.playAnimation([4,5,6,5,6,5,6,5], 0.1, 5);
				this.duckTimer = 0.8;

				if (this.falling) {
					this.sy = 1000;
				}
			}
		}
		unduck() {
			if (this.ducking) {
				this.shape = this.runShape;
				this.anim.playAnimation([0,1,2,3], 0.05);
				this.ducking = false;
			}
		}
		die() {
			this.dead = true;
			this.static = true;
			this.sx = 0;
			this.sy = 0;
			this.gravity = false;
			this.unduck();
			this.anim.stopAnimation(7,0);
			if (this == minigame.chicken) {
				minigame.die();
			}
		}
		update(dt) {
			if (this.sx != 0) {
				this.anim.update(dt);
			}

			if (this.ducking) {
				this.duckTimer -= dt;
				if (this.duckTimer < 0.1) {
					this.anim.stopAnimation(4,0);
				}
				if (this.duckTimer < 0) {
					this.unduck();
				}
			}

			if (this.dead) {
				return;
			}

			if (this == minigame.chicken && minigame.started) {
				this.sx = 400*minigame.speed;
			}

			if (this.spin) {
				this.rotation += 20*dt;
			}
		}
		collide(name,obj,nx,ny) {
			if (name == "RubberChicken") {
				return false;
			}
			if (ny < 0) {
				this.spin = false;
				this.rotation = 0;
				this.sy = Math.min(this.sy, 0);
			}
			if (name == "Fence") {
				if (this != minigame.chicken) {
				// Don't do anything if this is another player
					return false;
				}
				this.die();
			}
			return true;
		}
		startCollide(name,obj) {
			if (name == "Ground") {
				if (this != minigame.chicken) {
				// Don't do anything if this is another player
					return false;
				}
				this.falling = false;
			}
		}
		stopCollide(name,obj) {
			if (name == "Ground") {
				if (this != minigame.chicken) {
				// Don't do anything if this is another player
					return false;
				}
				this.falling = true;
			}
		}
		draw(x) {
			Draw.image(minigame.img.shadow, null, this.x-x, canvasHeight-200, 0, 1,1, 0.5,0.5);

			Draw.image(minigame.img.chicken, this.anim.getFrame(), this.x-x, this.y, this.rotation, 1,1, 0.5,0.5);
		}
	};
	Ground = class extends PhysicsObject {
		constructor(spatialHash, x=0, y=0) {
			super(spatialHash,x,y);
			this.w = canvasWidth;
			this.h = 600;
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
			this.setPosition(minigame.chicken.x-100, this.y);
		}
		draw() {

		}
		collide() {
			return true;
		}
	};
	Fence = class extends PhysicsObject {
		constructor(spatialHash, x=0, y=0, type="normal") {
			super(spatialHash,x,y);
			this.x = x;
			this.y = y;
			this.w = 20;
			this.h = 60;

			this.shape = new Shape(
				-this.w/2,-this.h/2,
				this.w/2,-this.h/2,
				this.w/2,this.h/2,
				-this.w/2,this.h/2
			);

			this.active = true;
			this.static = true;
			this.sx = 0;
			this.sy = 0;

			this.type = type;

			this.frame = 0;
			if (this.type == "normal") {
				let choice = Math.floor(Math.random()*20);
				if ((minigame.score > 20 && choice <= 1) || (minigame.score > 40 && choice <= 4)) {
					this.frame = 1;
				} else if (choice == 5) {
					this.frame = 2;
				}
			} else if (this.type == "sign") {
				this.y -= 80;
				this.frame = 3;
			} else if (this.type == "fly") {
				this.static = false;
			}

			this.passed = false;
			this.setPosition(this.x, this.y);
		}
		update(dt) {
			if (this.x < minigame.chicken.x-100-50) {
				this.destroy();
			} else if (this.x < minigame.chicken.x && this.passed != true) {
				minigame.addPoint();
				this.passed = true;
			}

			if (this.type == "fly") {
				if (this.x < minigame.chicken.x+500 && this.y > 200) {
					this.sy = -500;
				} else {
					this.sy = 0;
				}
			}
		}
		draw(x) {
			Draw.setColor(255,255,255,1.0);

			if (this.type == "sign") {
				Draw.image(minigame.img.fence, minigame.sprite.fence.getFrame(this.frame), this.x-x, this.y, 0, 1,1, 0.7,0.45);
			} else {
				Draw.image(minigame.img.fence, minigame.sprite.fence.getFrame(this.frame), this.x-x, this.y, 0, 1,1, 0.5,0.70);
			}
		}
		collide(name) {
			if (name == "Ground") {
				return false;
			}
			return true;
		}
	};
}