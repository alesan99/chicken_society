// Settings menu
// Configure volume

import {Draw} from "../engine/canvas.js";
import {IMG, SPRITE, ANIM, FONT, ITEMS} from "../assets.js";
import {Menu, MENUS} from "../menu.js";
import {Button, TextField, ColorSlider} from "../gui/gui.js";
import {openMenu, closeMenu} from "../state.js";
import { applySettings } from "../savedata.js";
import {SAVEDATA} from "../main.js";

MENUS["settingsMenu"] = new class extends Menu {
	//Initialize
	constructor () {
		super(234,104, 560,350);
	}

	load () {
		this.openTimer = 0;

		this.buttons = {};
		this.buttons["close"] = new Button("✖", ()=>{closeMenu();}, null, 740,128, 32,32);

		this.padding = 40;

		this.buttons["volume"] = new ColorSlider(this.x+this.w-200-this.padding, this.y+84, 200,20, SAVEDATA.settings.volume, 0, 1,
			(value)=>{ return [168, 85, 38, 1]; }, // get color at value
			(value)=>{ SAVEDATA.settings.volume = value; }, // Change value
			(value)=>{
				SAVEDATA.settings.volume = value;
				applySettings();
			} // Finish changing value
		);

		this.buttons["musicVolume"] = new ColorSlider(this.x+this.w-200-this.padding, this.y+124, 200,20, SAVEDATA.settings.musicVolume, 0, 1,
			(value)=>{ return [168, 85, 38, 1]; }, // get color at value
			(value)=>{ SAVEDATA.settings.musicVolume = value; }, // Change value
			(value)=>{
				SAVEDATA.settings.musicVolume = value;
				applySettings();
			} // Finish changing value
		);

		this.buttons["sfxVolume"] = new ColorSlider(this.x+this.w-200-this.padding, this.y+164, 200,20, SAVEDATA.settings.sfxVolume, 0, 1,
			(value)=>{ return [168, 85, 38, 1]; }, // get color at value
			(value)=>{ SAVEDATA.settings.sfxVolume = value; }, // Change value
			(value)=>{
				SAVEDATA.settings.sfxVolume = value;
				applySettings();
			} // Finish changing value
		);
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

		Draw.setColor(168, 85, 38, scale);
		Draw.line(this.x+20, this.y+60.5, this.x+this.w-20, this.y+60.5, 2*scale);

		// Text
		Draw.setColor(112, 50, 16, scale);
		Draw.setFont(FONT.caption);
		Draw.text("Settings", this.x+20, this.y+35, "left");
		
		Draw.text("Master Volume:", this.x+this.padding, this.y+100, "left");
		Draw.text("Music Volume:", this.x+this.padding, this.y+140, "left");
		Draw.text("Sound Volume:", this.x+this.padding, this.y+180, "left");

		// Render all buttons
		this.drawButtons();
	}

	update(dt) {
		this.openTimer = Math.min(1, this.openTimer + 4*dt);

		this.iconAnimationTimer = (this.iconAnimationTimer + dt) % 2;

		this.updateButtons(dt);
	}
}();