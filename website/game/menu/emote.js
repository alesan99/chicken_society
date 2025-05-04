//Emote menu; Press a button an player emotes

import {Draw} from "../engine/canvas.js";
import {IMG, SPRITE, ANIM, FONT, ITEMS} from "../assets.js";
import {Menu, MENUS} from "../menu.js";
import {Button, TextField, ColorSlider, ScrollBar} from "../gui/gui.js";
import {PLAYER, PLAYER_CONTROLLER} from "../world.js";

import {CHAT} from "../world.js";

MENUS["emoteMenu"] = new class extends Menu {
	//Initialize
	constructor () {
		super(157,414, 110,110);
	}

	load () {
		this.buttons = {};

		this.buttons[1] = new Button(false, ()=>{PLAYER.emote("wave"); CHAT.emoteMenuOpen = false;},
			{image: IMG.emoteMenu, frames:[SPRITE.emoteButton.getFrame(0,0),SPRITE.emoteButton.getFrame(1,0),SPRITE.emoteButton.getFrame(2,0)]}, this.x+34,this.y+5, 36,36);
		this.buttons[2] = new Button(false, ()=>{PLAYER.emote("sit"); CHAT.emoteMenuOpen = false;},
			{image: IMG.emoteMenu, frames:[SPRITE.emoteButton.getFrame(0,1),SPRITE.emoteButton.getFrame(1,1),SPRITE.emoteButton.getFrame(2,1)]}, this.x+7,this.y+36, 36,36);
		this.buttons[3] = new Button(false, ()=>{PLAYER.emote("dance"); CHAT.emoteMenuOpen = false;},
			{image: IMG.emoteMenu, frames:[SPRITE.emoteButton.getFrame(0,2),SPRITE.emoteButton.getFrame(1,2),SPRITE.emoteButton.getFrame(2,2)]}, this.x+66,this.y+36, 36,36);
		this.buttons[4] = new Button(false, ()=>{PLAYER.jump(); CHAT.emoteMenuOpen = false;},
			{image: IMG.emoteMenu, frames:[SPRITE.emoteButton.getFrame(0,3),SPRITE.emoteButton.getFrame(1,3),SPRITE.emoteButton.getFrame(2,3)]}, this.x+34,this.y+67, 36,36);
	}

	keyPress(key) {
	}

	keyRelease(key) {
	}

	mouseClick(button, x, y) {
		return super.mouseClick(button, x, y);
	}

	mouseRelease(button, x, y) {
		return super.mouseRelease(button, x, y);
	}
	
	draw() {
		// Window
		Draw.image(IMG.emoteMenu, [0,0,110,110], this.x, this.y);

		// Render all buttons
		this.drawButtons();
	}

	update(dt) {
		this.updateButtons(dt);
	}
}();