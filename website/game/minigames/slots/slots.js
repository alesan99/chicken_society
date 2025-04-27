// Example minigame

import { MINIGAMES } from "../minigame.js";
import { Draw } from "../../engine/canvas.js";
import { IMG, SPRITE, ANIM, FONT, SFX, loadJSON5, loadJSON, ITEMS } from "../../assets.js";
import { canvasWidth, canvasHeight } from "../../engine/canvas.js";

if (true) { // Set local scope

	MINIGAMES["slots"] = new class {
		constructor() {
		
		}

		load() {
			this.timer = 0;
			this.speed = 1;
		}

		update(dt) {
			this.timer += this.speed*dt;
			this.speed = Math.max(1, this.speed - 2*dt);
		}
  
		draw() {
		// Test
			Draw.clear(0,100,255);
			Draw.setColor(0,100,255,1.0);
			Draw.rectangle(0,0,canvasWidth,canvasHeight);
			Draw.setFont(FONT.big);
			let num = Math.ceil(this.speed);
			for (let i = 0; i < num; i++) {
				let a = 1.0;
				if (num != 1) {
					a = 1.0-(i/(num-1));
				}
				Draw.setColor(255,0,0,a);
				Draw.text("Hello World", canvasWidth/2, canvasHeight/2-10+Math.sin(this.timer-(i/100))*20, "center");
			}
		}

		keyPress(key) {
			this.speed += 1;
		}

		keyRelease(key) {
		
		}

		mouseClick(button, x, y) {

		}
	}();
}