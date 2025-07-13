// Map menu; Displays map and allows quick travel (?)

import {SAVEDATA, PROFILE, WORLD, NETPLAY, CURSOR} from "../main.js";
import {PLAYER} from "../world.js";
import {Draw} from "../engine/canvas.js";
import {IMG, SPRITE, ANIM, FONT, ITEMS, MAPLOCATIONS} from "../assets.js";
import {Menu, MENUS} from "../menu.js";
import {Button, TextField, ColorSlider, ScrollBar} from "../gui/gui.js";
import {openMenu, closeMenu, getOpenMenu} from "../state.js";
import { checkCondition } from "../area.js";

MENUS["mapMenu"] = new class extends Menu {
	//Initialize
	constructor () {
		super(234,104, 560,350);
	}

	load () {
		this.openTimer = 0;

		this.buttons = {};
		this.buttons["close"] = new Button("✖", ()=>{closeMenu();}, null, 740,128, 32,32);

		this.mapX = 23;
		this.mapY = 25;

		// Warp buttons
		// Only if player has unlocked warping
		this.canWarp = checkCondition({
			quest: "sewers",
			questComplete: true
		});
		if (this.canWarp) {
			const size = 24;
			// Warpable locations
			this.locations = MAPLOCATIONS;
			for (const [area, coords] of Object.entries(this.locations)) {
				if (area === PLAYER.area) {
					continue;
				}
				const x = coords[0];
				const y = coords[1];
				const warpFunc = function() {
					WORLD.warpToArea(area, "mapWarp", PLAYER);
					closeMenu(this);
				};
				this.buttons[`area-${area}`] = new Button(
					"",
					warpFunc,
					{
						image: IMG.map,
						frames: [
							SPRITE.mapIcons.getFrame(2,0),
							SPRITE.mapIcons.getFrame(2,0),
							SPRITE.mapIcons.getFrame(2,0)
						]
					},
					this.x+this.mapX+x-size/2,
					this.y+this.mapY+y-size/2,
					size,
					size,
				);
			}
		}

		this.iconAnimationTimer = 0;
	}

	keyPress(key) {
	}

	keyRelease(key) {
	}

	mouseClick(button, x, y) {
		super.mouseClick(button, x, y);
		if (!MENUS["chatMenu"].checkMouseInside()) {
			// Disable clicking anywhere else, except for chat hud
			return true;
		}
	}

	mouseRelease(button, x, y) {
		return super.mouseRelease(button, x, y);
	}
	
	draw() {
		// Window
		let scale = 1;
		if (this.openTimer < 1) {
			scale = easing("easeOutBack", this.openTimer);
		}
		Draw.image(IMG.menu, null, this.x+this.w*0.5, this.y+this.h*0.5, 0, scale, scale, 0.5, 0.5);

		// Map itself
		Draw.setColor(255, 255, 255, scale);
		Draw.image(IMG.map, SPRITE.map.getFrame(0,0), this.x+this.mapX, this.y+this.mapY);
		if (WORLD.areaMapLocation) {
			let l = WORLD.areaMapLocation;
			Draw.image(IMG.map, SPRITE.mapIcons.getFrame(Math.floor(this.iconAnimationTimer),0), this.x+this.mapX+l[0], this.y+this.mapY+l[1], 0, 1,1, 0.5,0.5);
		}

		// Map Border
		Draw.setColor(112, 50, 16, scale);
		Draw.setLineWidth(2);
		Draw.rectangle(this.x+this.mapX+1, this.y+this.mapY+1, SPRITE.map.w-2, SPRITE.map.h-2, "line");

		// Text
		Draw.setColor(255,255,255, scale);
		Draw.setFont(FONT.caption, 3);
		Draw.text(WORLD.areaName, 512, 152, "center");

		// Render all buttons
		this.drawButtons();
	}

	update(dt) {
		this.openTimer = Math.min(1, this.openTimer + 4*dt);

		this.iconAnimationTimer = (this.iconAnimationTimer + dt) % 2;

		this.updateButtons(dt);
	}
}();