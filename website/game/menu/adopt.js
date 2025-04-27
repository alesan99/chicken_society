// Adopt prompt
// Tells you that equipping a pet will overwrite your current pet

import {Draw} from "../engine/canvas.js";
import {IMG, SPRITE, ANIM, FONT, ITEMS} from "../assets.js";
import {Menu, MENUS} from "../menu.js";
import {Button, TextField} from "../gui/gui.js";
import {openMenu, closeMenu} from "../state.js";
import {adoptPet} from "../items.js";

MENUS["adoptMenu"] = new class extends Menu {
	//Initialize
	constructor () {
		super(287,198, 450,180);
	}

	load (targetPet) {
		this.openTimer = 0;

		// Pet to be adopted
		this.targetPet = targetPet;
		this.petName = "";

		// Buttons
		this.buttons = {};
		this.buttons["close"] = new Button("✖", ()=>{closeMenu();}, null, 694,212, 32,32);

		this.buttons["cancel"] = new Button("Cancel", ()=>{openMenu("customization");}, null, 340,332, 120,32);
		this.buttons["confirm"] = new Button("Confirm", ()=>{closeMenu(); adoptPet(this.targetPet, this.petName);}, null, 560,332, 120,32);

		this.buttons["name"] = new TextField(this.petName, (text)=>{this.petName = text;}, null, 380,290, 200,32);
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
		Draw.image(IMG.popup, null, this.x+this.w*0.5, this.y+this.h*0.5, 0, scale, scale, 0.5, 0.5);

		// Text
		Draw.setColor(112, 50, 16, scale);
		Draw.setFont(FONT.caption);
		Draw.text("Adopt new pet?", 512, 234, "center");
		
		Draw.text("This will ERASE your current pet's memory.", 310, 275, "left");

		
		Draw.text("Name:", 310, 312, "left");

		// Render all buttons
		this.drawButtons();
	}

	update(dt) {
		this.openTimer = Math.min(1, this.openTimer + 4*dt);

		this.updateButtons(dt);
	}
}();