// Pet menu; Shows your pet's status

import {SAVEDATA, PROFILE, WORLD, NETPLAY, CURSOR} from "../main.js";
import {Draw} from "../engine/canvas.js";
import {IMG, SPRITE, ANIM, FONT, ITEMS} from "../assets.js";
import {Menu, MENUS} from "../menu.js";
import {Button, TextField, ColorSlider, ScrollBar} from "../gui/gui.js";
import {ItemGrid} from "../gui/itemgrid.js";
import {HEXtoRGB, RGBtoHEX, removeNuggets, addNuggets, spendNuggets, addItem, removeItem, getItemCategory, getItemData, getItem} from "../savedata.js";
import {openMenu, closeMenu, getOpenMenu} from "../state.js";
import {PLAYER, PLAYER_CONTROLLER} from "../world.js";

MENUS["petMenu"] = new class extends Menu {
	//Initialize
	constructor () {
		super(234,104, 560,350);
	}

	load () {
		this.openTimer = 0;

		this.buttons = {};
		this.buttons["close"] = new Button("✖", ()=>{closeMenu();}, null, 740,128, 32,32);

		// Get Pet information
		this.pet = PLAYER.petObj;

		this.petMood = this.pet.getMood();

		// Name
		this.buttons["name"] = new TextField(this.pet.name, (text)=>{
			SAVEDATA.pet.name = text;
			this.pet.updateProfile(SAVEDATA.pet, "sendToServer");
		}, null, 260,129, 200,32);

		// Inventory (just items; for feeding)
		this.inventory = [];
		this.filter = "item";
		this.filterInventory(this.filter);
		this.buttons["inventory"] = new ItemGrid(
			(itemId,itemType)=>{
				// Set clothing item
				let item = ITEMS[itemType][itemId];
				if (itemType == "item" && item.consumable) {
					this.pet.eat(item);
					removeItem(itemId, itemType);
					this.filterInventory(this.filter); // Refresh item list
				}
			},
			this.inventory,
			(itemId,itemType)=>{
				// Is selected?
				if (PROFILE[itemType] && PROFILE[itemType] == itemId) {
					return true;
				}
			}, 476,314, 56,56, 5,2);
		this.buttons["inventory"].showCount = true; // How how many of each item the player owns
	}

	filterInventory(category) {
		this.filter = category;
		this.inventory.length = 0;
		if (category == "all") {
			for (let category in SAVEDATA.items) {
				for (let itemId in SAVEDATA.items[category]) {
					this.inventory.push(itemId);
				}
			}
		} else {
			for (let itemId in SAVEDATA.items[category]) {
				this.inventory.push(itemId);
			}
		}
	}

	mouseClick(button, x, y) {
		let clicked = super.mouseClick(button, x, y);
		if (!clicked) {
			closeMenu();
		}
		return clicked;
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
		
		// Pet
		this.pet.draw(360,340,"down");

		// Pet Status
		Draw.setColor(112, 50, 16, scale);
		Draw.setFont(FONT.caption);
		Draw.setColor(112, 50, 16, scale);
		Draw.text(`Feeling ${this.petMood}.`, 476, 184, "left");
		Draw.text("Health:", 476, 224, "left");
		Draw.text("Food:", 476, 254, "left");
		Draw.text("Feed: ", 476, 304, "left");

		Draw.setColor(240, 240, 240, scale);
		Draw.rectangle(566, 228-20, 200, 20);
		Draw.rectangle(566, 258-20, 200, 20);
		Draw.setColor(20, 200, 20, scale);
		Draw.rectangle(566, 228-20+1, 200*(this.pet.health), 18);
		Draw.rectangle(566, 258-20+1, 200*(this.pet.hunger), 18);

		// Render all buttons
		this.drawButtons();
	}

	update(dt) {
		this.openTimer = Math.min(1, this.openTimer + 4*dt);

		this.updateButtons(dt);
	}
}();