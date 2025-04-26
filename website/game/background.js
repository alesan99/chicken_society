//////////////////////////////
//////////////////////////////
// TODO: this is unfinished //
//////////////////////////////
//////////////////////////////
// Move over code from world.js to here

// Background System

// Background Sprite
// An separate image that belongs to the background
// Can be animated and/or interactable

import { BACKGROUNDIMG, BACKGROUNDSPRITE, BACKGROUNDANIM } from "./assets.js";
import { RenderImage } from "./engine/render.js";
import { Sprite, DrawableSprite, Animation } from "./engine/sprite.js";

class BackgroundSprite {
	constructor(img, s, anim, x, y, worldy) {
		if (!BACKGROUNDIMG[this.area][img]) {
			BACKGROUNDIMG[this.area][img] = new RenderImage(`assets/areas/${img}`);
		}
		let sprite = new Sprite(BACKGROUNDIMG[this.area][img], s.framesx, s.framesy, s.w, s.h, s.ox, s.oy, s.sepx, s.sepy);
		BACKGROUNDSPRITE[this.area][name] = new DrawableSprite(sprite, null, s.x, s.y, s.worldy);
		// If defined, play animation
		if (s.anim) {
			BACKGROUNDANIM[this.area][name] = new Animation(sprite, 0, 0);
			BACKGROUNDANIM[this.area][name].playAnimation(s.anim.frames, s.anim.delay, null);
			BACKGROUNDSPRITE[this.area][name].anim = BACKGROUNDANIM[this.area][name];
		}
	}
}