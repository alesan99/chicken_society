// A particle object
// This is a small little animation that briefly appears in the world
// This can be something like a gunshot or dust cloud

import {DRAW, SAVEDATA, PROFILE, WORLD, NETPLAY, CURSOR} from "../main.js";
import {IMG, SPRITE, ANIM, FONT, SFX, ITEMS} from "../assets.js";
import {HEXtoRGB, RGBtoHEX, removeNuggets, addNuggets, spendNuggets, addItem, removeItem, getItemCategory, getItemData, getItem} from "../savedata.js";
import Shape from "../shape.js";
import { canvasWidth, canvasHeight } from "../engine/render.js";
import { OBJECTS, PLAYER, PLAYER_CONTROLLER, PHYSICSWORLD } from "../world.js";
import { Animation } from "../engine/sprite.js";
import QuestSystem from "../quests.js";
import DialogueSystem from "../dialogue.js";
import AudioSystem from "../engine/audio.js";
import Transition from "../transition.js";
import {requestItem, compareItems, clearItems, useItem, adoptPet} from "../items.js";
import { getMousePos } from "../engine/input.js";
import { vec2Unit } from "../lib/vec2.js";
import {PhysicsObject,Character,Player,NPC,Pet,Trigger,Wall,Warp,Furniture} from "./objects.js";

export default class Particle {
	constructor(x, y, image, sprite, anim, delay=0.1) {
		this.x = x;
		this.y = y;
		this.image = image;
		this.sprite = sprite;
		this.anim = new Animation(this.sprite, 0);
		this.anim.playAnimation(anim, delay, 0);
	}

	update(dt) {
		// Update the particle
		this.anim.update(dt);

		if (this.anim.playing == false) {
			// Remove the particle
			this.destroy();
			return true;
		}
	}

	draw() {
		// Draw the particle
		DRAW.image(this.image, this.anim.getFrame(), this.x,this.y, 0, 1,1, 0.5,0.5);
	}

	destroy() {
		this.DELETED = true;
	}
}