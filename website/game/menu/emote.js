//Emote menu; Press a button an player emotes

import {DRAW, SAVEDATA, PROFILE, WORLD, NETPLAY, CURSOR} from "../main.js"
import {IMG, SPRITE, ANIM, FONT, ITEMS} from "../assets.js"
import {canvasWidth, canvasHeight} from "../engine/render.js"
import {Menu, MENUS} from "../menu.js"
import {Button, TextField, ColorSlider, ScrollBar} from "../gui/gui.js"
import {ItemGrid} from "../gui/itemgrid.js"
import {HEXtoRGB, RGBtoHEX, removeNuggets, addNuggets, spendNuggets, addItem, removeItem, getItemCategory, getItemData, getItem} from "../savedata.js"
import {openMenu, closeMenu, getOpenMenu} from "../state.js"
import {PLAYER, PLAYER_CONTROLLER} from "../world.js"
import QuestSystem from "../quests.js"
import Transition from "../transition.js"
import {requestItem, compareItems, clearItems, useItem, adoptPet} from "../items.js"

import {CHAT} from "../world.js"

MENUS["emoteMenu"] = new class extends Menu {
	//Initialize
	constructor () {
		super(177,414, 110,110)
	}

    load () {
		this.buttons = {}

		this.buttons[1] = new Button(false, ()=>{PLAYER.emote("wave"); CHAT.emoteMenuOpen = false},
            {image: IMG.emoteMenu, frames:[SPRITE.emoteButton.getFrame(0,0),SPRITE.emoteButton.getFrame(1,0),SPRITE.emoteButton.getFrame(2,0)]}, 211,432, 36,36)
		this.buttons[2] = new Button(false, ()=>{PLAYER.emote("sit"); CHAT.emoteMenuOpen = false},
            {image: IMG.emoteMenu, frames:[SPRITE.emoteButton.getFrame(0,1),SPRITE.emoteButton.getFrame(1,1),SPRITE.emoteButton.getFrame(2,1)]}, 194,467, 36,36)
		this.buttons[3] = new Button(false, ()=>{PLAYER.emote("dance"); CHAT.emoteMenuOpen = false},
            {image: IMG.emoteMenu, frames:[SPRITE.emoteButton.getFrame(0,2),SPRITE.emoteButton.getFrame(1,2),SPRITE.emoteButton.getFrame(2,2)]}, 233,467, 36,36)
    }

	keyPress(key) {
	}

	keyRelease(key) {
	}

	mouseClick(button, x, y) {
		return super.mouseClick(button, x, y)
	}

	mouseRelease(button, x, y) {
		return super.mouseRelease(button, x, y)
	}
	
	draw() {
        // Window
        DRAW.image(IMG.emoteMenu, [0,0,110,110], this.x, this.y)

		// Render all buttons
		this.drawButtons()
	}

	update(dt) {
		this.updateButtons(dt)
	}
}()