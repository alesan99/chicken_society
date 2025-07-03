//Character object, a 'chicken' with a collision box and the ability to move

import {SAVEDATA, PROFILE, WORLD, NETPLAY, CURSOR} from "../main.js";
import { Draw } from "../engine/canvas.js";
import {IMG, SPRITE, ANIM, FONT, SFX, ITEMS} from "../assets.js";
import {HEXtoRGB, RGBtoHEX, removeNuggets, addNuggets, spendNuggets, addItem, removeItem, getItemCategory, getItemData, getItem} from "../savedata.js";
import Shape from "../shape.js";
import { canvasWidth, canvasHeight } from "../engine/canvas.js";
import { OBJECTS, PLAYER, PLAYER_CONTROLLER, PHYSICSWORLD, PARTICLES } from "../world.js";
import { Animation } from "../engine/sprite.js";
import QuestSystem from "../quests.js";
import AudioSystem from "../engine/audio.js";
import { vec2Unit } from "../lib/vec2.js";
import {PhysicsObject,Player,NPC,Pet,Trigger,Wall,Warp,Furniture,Particle} from "./objects.js";
import {FACEOFFSET, ITEMOFFSET, BODYOFFSET, HEADOFFSET, CHICKENROTATION} from "../assets.js";

let dir_lookup = {up: 2, down: 0, left: 1, right: 1};

export default class Character extends PhysicsObject {
	//Initialize: spatialHash, x pos, y pos, width, height
	constructor (spatialHash, x, y, profile, area, id) {
		// Collision
		super(spatialHash,x,y);
		this.x = x || 0;
		this.y = y || 0;
		this.w = 70; //Width
		this.h = 40; //Height
		
		let bevel = 16; // bevel hitbox so you slide into doorways (TODO: Only do this for main player for performance reasons?)
		this.shape = new Shape(
			-this.w/2, -this.h+bevel,
			-this.w/2+bevel, -this.h,
			this.w/2-bevel, -this.h,
			this.w/2, -this.h+bevel,
			this.w/2, 0-bevel,
			this.w/2-bevel, 0,
			(-this.w/2)+bevel, 0,
			(-this.w/2), 0-bevel
		);

		this.z = 0; //(visual distance from ground)

		this.active = true;
		this.static = false;
		this.setPosition(null,null);

		// Properties
		this.image = IMG.chicken;
		this.id = id;
		this.updateProfile(profile);
		this.speed = 200; //Speed (px/sec)
		this.controller = false; //Is it being controlled?
		this.area = area || ""; //Current area

		this.sx = 0; // Speed x
		this.sy = 0; // Speed y
		this.sz = 0; // Speed z
		this.zgravity = 1800; // Gravity

		this.health = 1.0;
		this.statusEffects = []; // List of status effect objects
		this.statusEffectsLookup = {}; // Quick lookup to see if character has status effect

		// Graphics
		this.sprite = SPRITE.chicken;
		this.anim = new Animation(this.sprite, 0);
		this.anim.setFrame(0,0);
		this.walking = false;
		this.oldwalking = this.walking;
		this.dir = "down";
		this.visibleDir = this.dir; //direction last time the animation was updated
		this.flip = 1;
		this.imageOffsety = 4;
		this.scale = profile.scale || 1;
		this.rotation = 0;
		this.appearing = false; // in/out. Appearing animation when entering or leaving an area
		this.appearAnim = 1.0;

		this.timer = 0;

		// Expressions
		this.bubbleText = false; // string, show speech bubble over character
		this.bubbleTextWrapped = false; // List of strings; represents each line of the speech bubble text
		this.bubbleTime = false; // How long the bubble is visible (seconds)
		this.bubbleTimer = 0;
	}

	// Move: direction normal x, direction normal y
	move(nx, ny) {
		// Check if player should be currently unable to move
		if (this.static || this.getStatusEffect("dead")) {
			this.sx = 0;
			this.sy = 0;
			this.walking = false;
			return false;
		}

		// Speed modifiers
		let speed = this.speed;
		if (this.getStatusEffect("drowsy")) { // Walk slower
			speed *= 0.8;
		} else if (this.getStatusEffect("caffeinated")) { // Walk faster
			speed *= 1.75;
		} else if (this.getStatusEffect("drunk")) {  // Can't walk straight
			let angle = 0.2*Math.sin(this.timer*2.0); // wobbly angle
			speed *= (1-(Math.cos(this.timer*3.0)+1)/6); // walk at random speeds
			nx = nx * Math.cos(angle) - ny * Math.sin(angle);
			ny = nx * Math.sin(angle) + ny * Math.cos(angle);
		}

		// Move in direction of normal
		this.sx = nx*speed;
		this.sy = ny*speed;

		// Find direction player is facing
		this.walking = true;
		if ((nx == 0) && (ny == 0)) {
			this.walking = false;
		} else if (Math.abs(ny) >= Math.abs(nx)) {
			if (ny > 0) {
				this.dir = "down"; // Down
				this.flip = 1;
			} else {
				this.dir = "up"; // Up
				this.flip = 1;
			}
		} else {
			if (nx > 0) {
				this.dir = "right"; // Right
				this.flip = 1;
			} else {
				this.dir = "left"; // Left
				this.flip = -1;
			}
		}
	}

	update(dt) {
		// Update movement
		// TODO: Remove?
		if (this.controller != PLAYER_CONTROLLER) {
			// Update other clients
			if (this.sx == false && this.sy == false) {
				// not moving
				this.walking = false;
			}
		}

		// Jumping
		if (this.z != 0 || this.sz != 0) {
			this.z = this.z + this.sz*dt;
			this.sz = this.sz + this.zgravity*dt;

			// Land on ground
			if (this.z > 0) {
				this.land();
			}
		}

		// Update Animation
		if (this.walking != this.oldwalking) {
			if (this.walking) { // Walk if moving
				this.anim.playAnimation(ANIM.walk[0], ANIM.walk[1]);
			} else {
				this.anim.stopAnimation(0, null);
			}
		}

		// Appearing animation
		if (this.appearing == "in") {
			this.appearAnim = this.appearAnim + 5*dt;
			if (this.appearAnim >= 1.0) {
				this.appearing = false;
			}
		} else if (this.appearing == "out") {
			this.appearAnim = this.appearAnim - 1*dt;
			if (this.appearAnim <= 0.0) {
				this.appearing = false;
			}
		}

		// Update status effects
		this.updateStatusEffects(dt);

		// Update walking or emote animation
		this.anim.update(dt);

		// Dissapear chat bubble after few seconds
		if (this.bubbleText != false) {
			this.bubbleTimer += dt;
			if (this.bubbleTimer > this.bubbleTime) {
				this.bubbleTime = false;
				this.bubbleText = false;
			}
		}

		this.timer += dt;
		this.oldwalking = this.walking;
	}

	// Render chicken with accessories with optional different position
	draw(drawX=this.x, drawY=this.y, dir=this.dir, scale=this.scale, rot=this.rotation) {
		// Appearing animation
		let scaleX = scale;
		let scaleY = scale;
		if (this.appearing == "in") {
			scaleX *= easing("easeOutSine", this.appearAnim);
		} else if (this.appearing == "out") {
			let cutoff = 0.8;
			scaleX *= easing("easeInSine", (Math.max(cutoff,this.appearAnim)-cutoff)/(1.0-cutoff));
		}

		// Is player dead?
		if (this.getStatusEffect("dead")) {
			rot = Math.PI/2;
			dir = "right";
			drawX -= 60; drawY -= 40;
		}

		// Face in the current direction
		this.anim.setFrame(null, dir_lookup[dir]);

		// Shadow
		if (!this.getStatusEffect("dead")) {
			Draw.setColor(255,255,255,1.0);
			Draw.image(IMG.shadow, null, drawX, drawY+this.imageOffsety +3, 0, scaleX, scale, 0.5, 1);
		}

		// Jumping
		drawY += this.z;

		// Chicken and accessories
		if ((this.item != false) && (ITEMS.item[this.item] != null) && (ITEMS.item[this.item].sprite != null) && (dir == "up" || dir == "left")) { // Held item
			// Render item under chicken if facing up
			this.drawItem(ITEMS.item[this.item], ITEMOFFSET, drawX, drawY, dir, scaleX, scaleY, rot);
		}

		// Character image
		Draw.setColor(this.color[0],this.color[1],this.color[2],1.0);
		Draw.image(this.image, this.anim.getFrame(), drawX, drawY+this.imageOffsety, rot, this.flip*scaleX, scaleY, 0.5, 1);

		Draw.setColor(255,255,255,1.0);
		if ((this.body != false) && (ITEMS.body[this.body] != null) && (ITEMS.body[this.body].sprite != null)) { // Body item
			// Figure out the center of the body item to place it on the center of the chicken's 'neck'
			this.drawItem(ITEMS.body[this.body], BODYOFFSET, drawX, drawY, dir, scaleX, scaleY, rot);
		}

		Draw.image(this.image, this.anim.getFrame(null, 3), drawX, drawY+this.imageOffsety, rot, this.flip*scaleX, scaleY, 0.5, 1); // Uncolored sprite
		
		if ((this.face != false) && (ITEMS.face[this.face] != null) && (ITEMS.face[this.face].sprite != null)) { // Face item
			// Figure out the center of the face item to place it on the center of the chicken's face
			this.drawItem(ITEMS.face[this.face], FACEOFFSET, drawX, drawY, dir, scaleX, scaleY, rot);
		}

		if ((this.head != false) && (ITEMS.head[this.head] != null) && (ITEMS.head[this.head].sprite != null)) { // Head item
			// Figure out the center of the head item to place it on the center of the chicken's head
			this.drawItem(ITEMS.head[this.head], HEADOFFSET, drawX, drawY, dir, scaleX, scaleY, rot);
		}

		if ((this.item != false) && (ITEMS.item[this.item] != null) && (ITEMS.item[this.item].sprite != null) && (dir != "up" && dir != "left")) { // Held item
			this.drawItem(ITEMS.item[this.item], ITEMOFFSET, drawX, drawY, dir, scaleX, scaleY, rot);
		}
	}

	drawItem(item, offsets, drawX=this.x, drawY=this.y, dir=this.dir, scaleX=this.scale, scaleY=this.scale, rot=this.rotation) {
		// Figure out the center of the item to place it on the location defined on character
		let offsetX = -(SPRITE.chicken.w/2)*this.flip*scaleX + (offsets[dir_lookup[dir]][this.anim.framex][0])*this.flip*scaleX;
		let offsetY = -SPRITE.chicken.h*scaleY + offsets[dir_lookup[dir]][this.anim.framex][1]*scaleY;

		let x = drawX                   + offsetX*Math.cos(rot) - offsetY*Math.sin(rot);
		let y = drawY+this.imageOffsety + offsetX*Math.sin(rot) + offsetY*Math.cos(rot);

		let centerX = item.center[dir_lookup[dir]][0]/item.sprite.w;
		let centerY = item.center[dir_lookup[dir]][1]/item.sprite.h;
		Draw.image(item.image, item.sprite.getFrame(0, dir_lookup[dir]), x, y, rot+CHICKENROTATION[this.anim.framex], this.flip*scaleX, scaleY, centerX, centerY);
	}

	drawOver() {
		// Nametag
		Draw.setFont(FONT.nametag, 3);
		if (this.npc) {
			Draw.setColor(180,180,180,1);
		} else {
			Draw.setColor(255,255,255,1);
		}
		Draw.text(this.name, Math.floor(this.x), Math.min(canvasHeight-54, Math.floor(this.y)+20), "center");

		// Status Effects
		for (let i = 0; i < this.statusEffects.length; i++) {
			let effect = this.statusEffects[i];
			let time = `${Math.floor(effect.timer/60)}:${Math.floor(effect.timer%60).toString().padStart(2, "0")}`;
			Draw.text(`(${effect.name} ${time})`, Math.floor(this.x), Math.min(canvasHeight-54+(i+1)*20, Math.floor(this.y)+20+(i+1)*20), "center");
		}

		// Chat bubble
		if (this.bubbleText != false) {
			let offsetY = 140;
			let maxY = 100;
			if (this.npc && this.controller.awaitingReply) {
				// Leave space for npc replies
				maxY = 130;
			}
			let bubbleY = Math.max(maxY, Math.floor(this.y) -offsetY);

			// Goofy chat bubble animation
			// Slowly embiggen bubble
			let animLength = 1/6;
			let endAnimLength = 1/8;
			let scale = 1;
			if (this.bubbleTimer < animLength) {
				// Grow
				let t = Math.min(1, this.bubbleTimer/animLength); // Animation position
				scale = easing("easeOutQuad", t);
			} else if (this.bubbleTimer > this.bubbleTime-endAnimLength) {
				// Shrink
				let t = Math.min(1, (this.bubbleTime-this.bubbleTimer)/endAnimLength); // Animation position
				scale = easing("easeOutQuad", t);
			}
			// Wiggle bubble
			let flip = 1-Math.floor((this.bubbleTimer%1)*2)*2;
			
			Draw.setColor(255,255,255,1.0);
			Draw.image(IMG.speechBubble, null, this.x, bubbleY, 0, scale*flip, scale, 0.5, 1);

			// Render wrapped text so it fits into the bubble
			Draw.setFont(FONT.speechBubble);
			Draw.setColor(0,0,0,scale**2);

			let verticalSpacing = 18;
			for (let line = 0; line < this.bubbleTextWrapped.length; line++) {
				let textSegment = this.bubbleTextWrapped[line];
				Draw.text(textSegment, Math.floor(this.x), bubbleY + line*verticalSpacing-(this.bubbleTextWrapped.length*verticalSpacing/2)-41, "center");
			}
		}
	}

	// Update appearance based on given profile
	updateProfile(profile, sendToServer) {
		this.name = profile.name || ""; //name
		this.color = HEXtoRGB(profile.color) || [255,255,255];
		this.head = profile.head || false;
		this.face = profile.face || false;
		this.body = profile.body || false;
		this.item = profile.item || false;

		if (this.pet != profile.pet) {
			this.pet = profile.pet || false;
			if (this.petObj) {
				this.petObj.destroy();
			}
			if (this.pet) {
				let i = Math.random();
				let petProfile; // get pet profile from savedata or client data (not ideal)
				if (this.controller == PLAYER_CONTROLLER) {
					petProfile = SAVEDATA.profile.pet;
				} else if (this.id != null && this.id in NETPLAY.playerList) {
					petProfile = NETPLAY.playerList[this.id].pet;
				}
				OBJECTS["Pet"][i] = new Pet(this.spatialHash, profile.pet, this.x, this.y, this, petProfile);
				this.petObj = OBJECTS["Pet"][i];
			}
		}

		// Progress Quests
		if (this.controller == PLAYER_CONTROLLER) {
			QuestSystem.event("clothes", this.head, this.face, this.body, this.item);
		}

		this.scale = profile.scale || 1;
		//Send profile to server if this is the player
		if (sendToServer && this.controller == PLAYER_CONTROLLER) {
			NETPLAY.sendProfile(PROFILE);
		}
	}

	// Display speech bubble
	speechBubble(text, time) {
		this.bubbleText = text;
		this.bubbleTime = time || 4;
		this.bubbleTimer = 0;

		// Wrap text so it fits in text bubble
		Draw.setFont(FONT.speechBubble);
		this.bubbleTextWrapped = Draw.wrapText(this.bubbleText, 156);
	}

	// Play emote animation; will stop when player moves
	emote(i) {
		if (ANIM[i] != null) {
			// Reset player animation state
			if (this.controller && this.controller.stop) {
				this.controller.stop();
			}
			this.move(0, 0);
			this.walking = false;
			this.oldwalking = false; // Hack, stops code in update(dt) from attempting to stop walking anim, which isn't playing
			this.dir = "down";
			this.flip = 1;
			// Play emote animation
			this.anim.playAnimation(ANIM[i][0], ANIM[i][1], 0);

			if (this == PLAYER) {
				NETPLAY.sendNewAction("emote", i);
			}
		}
	}

	// Use held item
	useItem() {
		if (!this.item) {
			return false;
		}

		let item = ITEMS.item[this.item];

		if (this.item == "gun") {
			this.shoot();
		}
	}

	// Status Effects
	// These affect the character's behavior
	startStatusEffect(name, duration=1.0) {
		// Status Effects:
		// Caffeinated (Any coffee)
		// Drunk (Beer, liquor)
		// Quirked Up (Heroin)

		// Lucky (Lucky charms)
		// Cursed (Hidden effect!)
		// Divine Intervention

		// Drowsy (Lean)
		// Sick (Food poisoning)
		// Injured (Getting shot, Bat)
		// Dead (Getting shot)

		// Possible Effects:
		// Slow/Fast Speed
		// Wonky movement direction
		// Gambling luck
		// Dead (static and laying down)
		// Jumping?

		let effect = {
			name: name,
			timer: duration
		};

		// Overwrite any effect of the same type
		let addEffect = true;
		for (let i = this.statusEffects.length-1; i >= 0; i--) {
			let effect2 = this.statusEffects[i];
			if (effect2.name == name) { // Same name?
				if (effect2.timer < effect.timer) { // Only overwrite if current effect lasts longer
					this.statusEffects.splice(i, 1);
				} else { // Otherwise, don't add effect anymore.
					addEffect = false;
				}
				break;
			}
		}

		if (addEffect) {
			this.statusEffects.push(effect);
			this.statusEffectsLookup[name] = true;
			if (this == PLAYER) {
				NETPLAY.sendNewAction("statusEffect", effect.name, duration);
			}
		}
	}

	endStatusEffect(name) {
		
	}

	updateStatusEffects(dt) {
		// Update status effect timers
		for (let i = this.statusEffects.length-1; i >= 0; i--) {
			let effect = this.statusEffects[i];
			effect.timer -= dt;
			if (effect.timer <= 0) {
				this.endStatusEffect(effect.name);
				this.statusEffects.splice(i, 1);
				delete this.statusEffectsLookup[effect.name];
				if (this == PLAYER) {
					NETPLAY.sendNewAction("statusEffect", effect.name, 0);
				}
			}
		}
	}

	getStatusEffect(name) {
		// Returns true/false if character has [name] status effect
		if (this.statusEffectsLookup[name]) {
			return true;
		}
		return false;
	}

	// Misc. Actions
	// Shooting! Guns etc.
	shoot(nx=0, ny=0) {
		// Don't shoot if dead
		if (this.getStatusEffect("dead")) {
			return false;
		}

		// Play gunshot sound
		AudioSystem.playSound(SFX.gun);
		// You, the player, shot a gun
		if (this == PLAYER) {
			// direction normal
			[nx, ny] = [1, 0];
			switch (this.dir) {
			case "up":
				[ny, nx] = [-1, 0];
				break;
			case "down":
				[ny, nx] = [1, 0];
				break;
			case "left":
				[ny, nx] = [0, -1];
				break;
			case "right":
				[ny, nx] = [0, 1];
				break;
			}
			NETPLAY.sendAction("shoot", nx, ny);
		// Other player shot a gun, see if you, the player, got hit
		// } else {
		}
		// Check which chickens are in the line of fire
		let closestDist = Infinity;
		let closestCharacter = false;
		for (const [id, obj] of Object.entries(OBJECTS["Character"])) {
			if (obj == this) { // Do not shoot self
				continue;
			}
			let dist = Math.abs(obj.x - this.x) + Math.abs(obj.y - this.y); // get distance
			let dx = obj.x - this.x;
			let dy = obj.y - this.y;
			if (Math.abs(dx) < 50 || Math.abs(dy) < 50) {
				// check if normal is facing in right direction
				// normalize dx, dy
				let [ndx, ndy] = vec2Unit(dx, dy);
				// Get similarity between the two vectors, (nx,ny) and (ndx,ndy)
				let dot = ndx*nx + ndy*ny;
				if (dot > 0.5 && dist < closestDist) {
					closestDist = dist;
					closestCharacter = obj;
				}
			}
		}
		// Hit closest character
		if (closestCharacter) {
			if (this != PLAYER) {
				if (closestCharacter == PLAYER && !closestCharacter.getStatusEffect("dead")) {
					// only kill players
					closestCharacter.startStatusEffect("dead", 10);
				}
			}
			// Show hit particle
			PARTICLES.push(new Particle(closestCharacter.x, closestCharacter.y-65, IMG.particle, SPRITE.dust, [0,1], 0.1));
		}
	
		// Gunshot particle
		let [muzzleX, muzzleY] = [this.x+nx*50, this.y-65+ny*12];
		if (this.dir == "down") {
			muzzleX -= 32;
		} else if (this.dir == "up") {
			muzzleX += 32;
		}
		PARTICLES.push(new Particle(muzzleX, muzzleY, IMG.particle, SPRITE.gunshot, [0,1], 0.05));
	}

	// Jump
	jump(dist=500) {
		if (dist == 0) {dist = 500;}
		this.sz = -dist;
		if (this == PLAYER) {
			NETPLAY.sendAction("jump", dist);
		}

		// High jumps should cause dust clouds
		if (dist > 1000) {
			PARTICLES.push(new Particle(this.x-20, this.y-4, IMG.particle, SPRITE.dust, [0,1], 0.1));
			PARTICLES.push(new Particle(this.x, this.y, IMG.particle, SPRITE.dust, [0,1], 0.1));
			PARTICLES.push(new Particle(this.x+20, this.y-4, IMG.particle, SPRITE.dust, [0,1], 0.1));
		}
	}

	land() {
		// Land on ground after a jump
		this.sz = 0;
		this.z = 0;
	}

	// Area Movement Animations
	appear() {
		this.appearing = "in";
		this.appearAnim = 0.0;
	}
	disappear() {
		this.appearing = "out";
		this.appearAnim = 1.0;
	}

	// Collision
	collide(name, obj, nx, ny) {
		if (name == "Character" || name == "Trigger") {
			return false;
		}
		if (name == "Furniture" && obj.rug) {
			return false;
		}
		return true;
	}

	startCollide(name, obj) {
		// Handle player collisions
		if (this.controller && this.controller.startCollide) {
			this.controller.startCollide(name, obj);
		}
	}

	stopCollide(name, obj) {
		// Handle player collisions
		if (this.controller && this.controller.stopCollide) {
			this.controller.stopCollide(name, obj);
		}
	}

	destroy() {
		// Destroy pet as well
		if (this.petObj) {
			this.petObj.destroy();
		}
		super.destroy();
	}
}