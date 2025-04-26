// Minigame state;
// Runs a given minigame script while allowing the player to still chat and exit the game
import { DRAW, SAVEDATA, WORLD } from "../main.js";
import Notify from "../gui/notification.js";
import { conditionsUpdate } from "../area.js";
import { IMG, SPRITE, ANIM, FONT, SFX, loadJSON5, ITEMS } from "../assets.js";
import {HEXtoRGB, RGBtoHEX, removeNuggets, addNuggets, spendNuggets, addItem, removeItem, getItemCategory, getItemData, getItem} from "../savedata.js";
import { MENUS } from "../menu.js";
import { OBJECTS, PLAYER, PLAYER_CONTROLLER, PHYSICSWORLD, DEBUGPHYSICS, CHAT, MINIGAME } from "../world.js";
import { NETPLAY } from "../main.js";
import { canvasWidth, canvasHeight, RenderImage } from "../engine/render.js";
import { Sprite, Animation } from "../engine/sprite.js";
import Shape from "../shape.js";
import AudioSystem from "../engine/audio.js";
import {PhysicsObject} from "../objects/objects.js";
import QuestSystem from "../quests.js";
import Transition from "../transition.js";
import { setState } from "../state.js";
import { Button, TextField, ColorSlider, ScrollBar } from "../gui/gui.js";
import { getMousePos } from "../engine/input.js";

var MINIGAMES = {};

class MinigameState {
	constructor() {
		this.name = "minigame";
	}

	load(minigameName) {
		// Load minigame and let server know you're playing
		this.minigameName = minigameName;
		this.minigame = MINIGAMES[minigameName];
		this.minigame.load();

		NETPLAY.sendMinigame(this.minigame, minigameName);

		this.exitButton = new Button("Exit", () => {this.exit();}, null, 900,50, 80,80);
		this.exited = false;

		// Quest progression
		QuestSystem.event("minigame", this.minigameName);
	}

	update(dt) {
		// Update minigame
		this.minigame.update(dt);
		if (!this.exited) {
			NETPLAY.update(dt);
		}

		this.exitButton.update(dt);

		// HUD
		CHAT.update(dt);
	}

	draw() {
		// Render minigame contents
		this.minigame.draw();

		this.exitButton.draw();
		
		// HUD
		CHAT.draw();
	}

	// Exit minigame
	exit() {
		if (Transition.playing()==true){
			return;
		}

		this.exited = true;
		NETPLAY.sendMinigame(false); // Disconnect from minigame

		Transition.start("wipeLeft", "out", 0.8, null, () => {
			// Unload minigame assets
			if (this.minigame.exit) {
				this.minigame.exit();
			}
			PLAYER.static = false;
			setState(WORLD); // Go back to world
			WORLD.returnToArea();
			Transition.start("wipeRight", "in", 0.8, null, null);
		});
	}

	newHighscore(score) {
		// Save highscore
		SAVEDATA.highscores[this.minigameName] = score;
		// Update quest progression
		QuestSystem.event("minigameHighscore", this.minigameName, score); // Progress quests
	}

	keyPress(key) {
		// Exit minigame
		if (key == "Escape") {
			this.exit();
			return true;
		}
		CHAT.keyPress(key);

		// Control minigame
		this.minigame.keyPress(key);
	}

	keyRelease(key) {
		// Control minigame
		this.minigame.keyRelease(key);
	}

	mouseClick(button, x, y) {
		if (CHAT.mouseClick(button, x, y)) {
			return true;
		}
		if (this.exitButton.click(button, x, y)) {
			return true;
		}
		// Control minigame
		this.minigame.mouseClick(button, x, y);
	}

	mouseRelease(button, x, y) {
		if (CHAT.mouseRelease(button, x, y)) {
			return true;
		}
		if (this.exitButton.clickRelease(button, x, y)) {
			return true;
		}
		// Control minigame
		if (this.minigame.mouseRelease) {
			this.minigame.mouseRelease(button, x, y);
		}
	}
}

export {MinigameState, MINIGAMES};