// Item button grid; Imagine the inventory from minecraft
import {SAVEDATA, PROFILE, WORLD, NETPLAY, CURSOR} from "../main.js";
import { Draw } from "../engine/canvas.js";
import {IMG, SPRITE, ANIM, FONT, ITEMS} from "../assets.js";
import { getMousePos } from "../engine/input.js";
import {Button, ScrollBar} from "./gui.js";
import {HEXtoRGB, RGBtoHEX, removeNuggets, addNuggets, spendNuggets, addItem, removeItem, getItemCategory, getItemData, getItem} from "../savedata.js";

class ItemGrid {
	// Callback function, x pos, y pos, cell width, cell height, grid width, grid height
	constructor(action, list, selectedFunc, x, y, cw=56, ch=56, gw, gh) {
		this.visible = true;
		this.action = action;

		this.list = list;

		this.selectedFunc = selectedFunc; // Which item in grid is selected?

		this.x = x;
		this.y = y;

		// Size of grid cells
		this.cw = cw;
		this.ch = ch;

		// Number of cells in grid
		this.gw = gw;
		this.gh = gh;

		// Total size
		this.w = cw*gw;
		this.h = ch*gh;

		// Which cell is mouse over
		this.overx = 0;
		this.overy = 0;
		this.over = false;

		// Vertical scroll
		this.scroll = 0;
		this.buttons = [];
		this.buttons["scrollBar"] = new ScrollBar(this.x+this.w, this.y, 20, this.h, 0, this.list.length/this.gw, this.gh, (scroll)=>{this.updateScroll(scroll);}, 1);
		//this.buttons["scrollUp"] = new Button("", ()=>{this.scrollUp()}, null, this.x+this.w, this.y, 20, 20)
		//this.buttons["scrollDown"] = new Button("", ()=>{this.scrollDown()}, null, this.x+this.w, this.y+this.h-20, 20, 20)

		this.hover = false;
		this.held = false;
	}

	checkMouseInside(){
		let [mouseX, mouseY] = getMousePos(); //returns x and y pos of mouse
		if (mouseX > this.x && mouseX < this.x + this.w && mouseY > this.y && mouseY < this.y + this.h) {
			// Get selected grid cell
			let cx = Math.floor((mouseX-this.x)/this.cw);
			let cy = Math.floor((mouseY-this.y)/this.ch);
			this.overx = cx;
			this.overy = cy;
			this.over = false;
			return [cx, cy];
		}
		return [false, false];
	}
	update(dt){
		let [cx, cy] = this.checkMouseInside();
		if (cx !== false && cy !== false) {
			if (!this.held) {
				this.overx = cx;
				this.overy = cy;
			}

			this.hover = true;
			let i = this.getCellIndex(cx, cy); // Index of cell
			if (this.list[i]) {
				CURSOR.on = true;
			}
		} else {
			this.hover = false;
		}

		// Scroll bar
		for (const button in this.buttons) {
			this.buttons[button].update(dt);
		}
	}

	click(button, x, y){
		let [cx, cy] = this.checkMouseInside();
		if (cx !== false && cy !== false) {
			this.overx = cx;
			this.overy = cy;
			this.held = true;
			return true;
		}

		// Scroll bar
		for (const button in this.buttons) {
			this.buttons[button].click(button, x, y);
		}
	}
	clickRelease(button, x, y){
		if (this.held == true){
			this.gridAction(this.overx, this.overy);
			this.held = false;
		}

		// Scroll bar
		for (const button in this.buttons) {
			this.buttons[button].clickRelease(button, x, y);
		}
	}
	mouseScroll(dy){
		this.buttons["scrollBar"].mouseScroll(dy);
	}
	updateScroll(scroll) {
		this.scroll = Math.floor(scroll+0.5);
	}

	getCellIndex(cx, cy) {
		return cx + (cy+this.scroll)*this.gw; // Index of cell
	}

	gridAction(cx, cy){
		let i = this.getCellIndex(cx, cy);
		if (this.list[i]) {
			this.action(this.list[i],getItemCategory(this.list[i]));
		}
	}

	updateList(list) {
		this.list = list;
		this.scroll = 0;
		this.buttons["scrollBar"].updateRange(0, this.list.length/this.gw, null);
	}

	draw(){
		// Scroll bar
		Draw.setColor(168, 85, 38, 1);
		Draw.rectangle(this.x+this.w, this.y, 20, this.h, "fill");
		for (const button in this.buttons) {
			this.buttons[button].draw();
		}

		// Render grid
		let [mouseX, mouseY] = getMousePos(); //returns x and y pos of mouse
		
		Draw.setColor(242, 242, 242, 1); // Light color for other cells
		Draw.rectangle(this.x, this.y, this.w, this.h);
		Draw.setFont(FONT.guiLabel);
		Draw.setLineWidth(2);
		// grid lines
		Draw.setColor(220,220,230, 1.0);
		for (let x = 1; x < this.gw; x++) {
			Draw.line(this.x + x*this.cw, this.y, this.x + x*this.cw, this.y + this.h);
		}
		for (let y = 1; y < this.gh; y++) {
			Draw.line(this.x, this.y + y*this.ch, this.x + this.w, this.y + y*this.ch);
		}

		// Render all grid cells
		for (let cx = 0; cx < this.gw; cx++) {
			for (let cy = 0; cy < this.gh; cy++) {
				let i = this.getCellIndex(cx, cy); // Index of cell
				if (this.list[i]) {
					let itemType = getItemCategory(this.list[i]);

					// Calculate the x and y position of the cell
					let cellX = this.x + cx * this.cw;
					let cellY = this.y + cy * this.ch;

					// Set the color based on whether the cell is being hovered over
					let hover = (this.hover && this.overx === cx && this.overy === cy);
					let selected = this.selectedFunc(this.list[i],itemType,hover);
					let held = (this.held && this.overx === cx && this.overy === cy);
					if (hover || held || selected) {
						if (held) {
							Draw.setColor(165, 165, 175, 1); // Dark color for selected cell (while held)
						} else if (hover) {
							Draw.setColor(208, 208, 238, 1); // Medium color for hovered cell
						} else if (this.list[i] && selected) {
							if (selected == "gray") {
								Draw.setColor(200, 200, 200, 1); // Dark color for selected cell
							} else {
								Draw.setColor(180, 190, 240, 1); // Dark color for selected cell
							}
						}
						// Draw the cell
						Draw.rectangle(cellX, cellY, this.cw, this.ch);
					}

					// Draw the cell border
					Draw.setColor(140, 140, 160, 1);
					Draw.rectangle(cellX+1, cellY+1, this.cw-2, this.ch-2, "line");

					// Draw item in this cell
					if (this.list[i]) {
						if (ITEMS[itemType][this.list[i]]) { // Make sure item has been loaded
							let image = ITEMS[itemType][this.list[i]].image;
							let sprite = ITEMS[itemType][this.list[i]].sprite;

							let scale = Math.min(1.0, 0.9*(this.cw/Math.max(sprite.w, sprite.h)));

							if (image) {
								Draw.image(image, sprite.getFrame(0,0), cellX+this.cw/2, cellY+this.ch/2, 0, scale, scale, 0.5, 0.5);
							}
						}

						// Count of item owned
						if (this.showCount && SAVEDATA.items[itemType][this.list[i]] > 1) {
							Draw.setColor(0, 0, 0, 1);
							Draw.text(SAVEDATA.items[itemType][this.list[i]], cellX+this.cw-2, cellY+this.ch-2, "right");
						}
					}
				}
			}
		}

		// Tooltip
		if (this.hover) {
			let cx = this.overx;
			let cy = this.overy;
			let i = cx + (cy+this.scroll)*this.gw; // Index of cell
			if (this.list[i]) {
				let itemType = getItemCategory(this.list[i]);
				if (itemType && ITEMS[itemType][this.list[i]]) { // Make sure item has been loaded
					let name = ITEMS[itemType][this.list[i]].name;
					let textWidth = Math.ceil(Draw.getTextWidth(name));
					Draw.setColor(255,255,255, 0.75);
					Draw.rectangle(mouseX+20, mouseY, textWidth, 24, "fill");
					Draw.setColor(128,128,128, 0.75);
					Draw.setLineWidth(1);
					Draw.rectangle(mouseX+20+0.5, mouseY+0.5, textWidth-1, 24-1, "line");
					Draw.setColor(0, 0, 0, 1);
					Draw.text(name, mouseX+20, mouseY+18, "left");
				}
			}
		}
	}
}

export {ItemGrid};