//Player object, listens to inputs to control another object

import { Draw } from "../engine/canvas.js";
import {IMG, SPRITE, ANIM, FONT, SFX, ITEMS} from "../assets.js";
import { getMousePos } from "../engine/input.js";
import { vec2Unit } from "../lib/vec2.js";
import {openMenu, closeMenu, getOpenMenu} from "../state.js";

export default class Player {
	//Initialize: x pos, y pos, width, height
	constructor (obj) {
		this.obj = obj;
		obj.controller = this;

		// Inputs
		this.arrowKeys = {
			left: false,
			right: false,
			up: false,
			down: false
		};
		this.mouseHold = false;

		this.target = false;
		this.targetX = 0;
		this.targetY = 0;
		this.targetTimer = 0;
		this.targetTime = 4.0; // Max time that will be spent moving to target

		this.targetOffsetY = 20; // Offset for where character will move to when clicking

		// Which triggers is the player currently inside of?
		this.triggers = new Map();
	}

	// Update
	update(dt) {
		let char = this.obj;

		// Handle movement inputs
		// If mouse button is being held, the player should be controlled by the mouse
		if (this.mouseHold) {
			let [mx, my] = getMousePos();

			let dist = ((mx-char.x)**2 + ((my + this.targetOffsetY)-char.y)**2);

			if (dist > 20**2) { // Don't move if mouse is too close to player
				this.setTarget(mx, my);
			}
		}
		if (this.target) {
			let targetX = this.targetX;
			let targetY = this.targetY + this.targetOffsetY;
			let targetDiffX = targetX - char.x;
			let targetDiffY = targetY - char.y;

			let [dx, dy] = vec2Unit(targetDiffX, targetDiffY); //convert to direction normal
			let futureX = char.x + dx*char.speed*dt;
			let futureY = char.y + dy*char.speed*dt;

			this.targetTimer -= dt;

			if ((((targetX-futureX > 0) != (targetX-char.x > 0)) || ((targetY-futureY > 0) != (targetY-char.y > 0))) // Don't move anymore if crossing target coordinate
				|| (this.targetTimer < 0) ) { // Or don't move if target hasn't been reached in a while
				this.stop();
			} else {
				char.move(dx, dy);
			}
		// Otherwise, use arrow key inputs
		} else {
			let dx = 0;
			let dy = 0;
			if (this.arrowKeys.left) {
				dx += -1;
			} else if (this.arrowKeys.right) {
				dx += 1;
			}
			if (this.arrowKeys.up) {
				dy += -1;
			} else if (this.arrowKeys.down) {
				dy += 1;
			}
			[dx, dy] = vec2Unit(dx, dy); //convert to direction normal
			char.move(dx, dy);
		}
	}

	// Draw movement cursor
	draw() {
		if (this.target) {
			Draw.setColor(255, 255, 255, 1.0);
			let x = this.targetX;
			let y = this.targetY;
			let scale = 0.8;
			if (this.mouseHold) {
				scale = 1.0;
			}
			Draw.image(IMG.moveCursor, null, x, y, 0, scale, scale, 0.5, 0.5);
		}
	}

	// Interact with nearby triggers
	interact() {
		let char = this.obj;
		if (this.triggers.size > 0) {
			// Find closest trigger that player is overlapping
			let closestTrigger = false;
			let closestDist = Infinity;
			for (const [key, trigger] of this.triggers.entries()) {
				let dist = ((trigger.x-char.x)**2 + (trigger.y-(char.y-char.shape.h/2))**2);
				if (dist < closestDist) {
					closestTrigger = trigger;
					closestDist = dist;
				}
			}
			if (closestTrigger) {
				closestTrigger.doAction();
			}
		}
	}

	// Inputs
	keyPress(key) {
		if (getOpenMenu()) {
			return;
		}
		switch (key) {
		// Movement
		case "ArrowLeft":
			this.arrowKeys.left = true;
			this.target = false;
			break;
		case "ArrowUp":
			this.arrowKeys.up = true;
			this.target = false;
			break;
		case "ArrowRight":
			this.arrowKeys.right = true;
			this.target = false;
			break;
		case "ArrowDown":
			this.arrowKeys.down = true;
			this.target = false;
			break;
		case " ":
			this.interact();
			break;
		case "Space":
			this.interact();
			break;
		case "e":
			this.obj.useItem();
			break;
		}
	}
	keyRelease(key) {
		switch (key) {
		// Movement
		case "ArrowLeft":
			this.arrowKeys.left = false;
			break;
		case "ArrowUp":
			this.arrowKeys.up = false;
			break;
		case "ArrowRight":
			this.arrowKeys.right = false;
			break;
		case "ArrowDown":
			this.arrowKeys.down = false;
			break;
		}
	}

	// Set new moving target
	setTarget(x, y) {
		this.target = true;
		this.targetX = x;
		this.targetY = y;
		this.targetTimer = this.targetTime;
	}

	// Reset state of player and player controller when moving to new area
	reset(charX, charY, dir="down") {
		let char = this.obj;
		// Teleport character
		char.setPosition(charX, charY);
		char.dir = dir;
		if (dir == "left") {
			char.flip = -1;
		} else {
			char.flip = 1;
		}

		// Also teleport pet
		if (char.pet) {
			char.petObj.setPosition(charX, charY);
		}

		// Stop movement
		this.target = false;
		this.mouseHold = false;
	}

	// Stop moving towards target
	stop() {
		let char = this.obj;
		// Stop mouse movement
		this.target = false;
		char.move(0, 0);
		// Stop keyboard movement
		this.arrowKeys.left = false;
		this.arrowKeys.right = false;
		this.arrowKeys.up = false;
		this.arrowKeys.down = false;
	}

	mouseClick(button, x, y) {
		// Movement
		// Check if left mouse button is being held
		if (button == 0) {
			this.setTarget(x, y);
			this.mouseHold = true;
		}

		// Use item
		if (button == 2) {
			this.obj.useItem();
		}
	}
	mouseRelease(button, x, y) {
		// Movement
		// Check if left mouse button is being held
		if (button == 0) {
			this.mouseHold = false;
		}
	}

	// Collide
	startCollide(name, obj) {
		let char = this.obj;
		if (name == "Trigger") {
			this.triggers.set(obj, obj);
		}
	}

	stopCollide(name, obj) {
		let char = this.obj;
		if (name == "Trigger") {
			this.triggers.delete(obj);
		}
	}
}