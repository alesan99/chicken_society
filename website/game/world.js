// World state; Displays a location, has moving characters with collision.
var PHYSICSWORLD;
var OBJECTS;
var CHARACTER;
var PLAYER;
var PLAYER_CONTROLLER;
var NPCS;
var PARTICLES;
var CHAT;
var DEBUGPHYSICS = false;
var MINIGAME;

import { canvasWidth, canvasHeight, Draw } from "./engine/canvas.js";
import { RenderImage } from "./engine/render.js";
import { IMG, SFX, FONT, MUSIC, loadJSON5, BACKGROUND, BACKGROUNDIMG, BACKGROUNDANIM, BACKGROUNDSPRITE } from "./assets.js";
import { SpatialHash, updatePhysics, drawPhysics } from "./physics.js";
import {PhysicsObject,Character,Player,NPC,Pet,Trigger,Wall,Warp,Furniture,Particle} from "./objects/objects.js";

import { PROFILE, SAVEDATA } from "./main.js";

import QuestSystem from "./quests.js";

import AudioSystem from "./engine/audio.js";
import Transition from "./transition.js";
import DialogueSystem from "./dialogue.js";
import LoadingScreen from "./loading.js";
import TimedEventsSystem from "./timedevents.js";
import { checkCondition } from "./area.js";
import { getMousePos } from "./engine/input.js";
import Coop from "./coop.js";
import { NETPLAY } from "./main.js";
import { MENUS } from "./menu.js";

import {} from "./menu/chat.js";
import {} from "./menu/emote.js";
import {} from "./menu/customization.js";
import {} from "./menu/map.js";
import {} from "./menu/users.js";
import {} from "./menu/quests.js";
import {} from "./menu/shop.js";
import {} from "./menu/pet.js";
import {} from "./menu/adopt.js";
import {} from "./menu/settings.js";

import { MinigameState } from "./minigames/minigame.js";
import {} from "./minigames/claw/claw.js";
import {} from "./minigames/runner/runner.js";
import {} from "./minigames/wormdle/wormdle.js";
import {} from "./minigames/eggs/eggs.js";

import { loadAreaFile } from "./area.js";
import PetRaceSystem from "./petrace.js";

const World = class {
	constructor (area="hub") {
		this.name = "world";

		// Area information
		this.area = area; //Area name
		this.oldArea = area; //Where did the player just come from? (Think warps)

		this.areaName = "???"; // Neat name for Area
		this.areaMapLocation = false; // [x, y] location to be displayed in map menu
		this.areaMusic = false; // Music to play in area
		this.areaMusicPosition = 0; // Where music left off

		// Initialize Physics world
		PHYSICSWORLD = new SpatialHash(canvasWidth, canvasHeight, 100);

		// Load Quests
		QuestSystem.initialize();

		// Physics objects
		OBJECTS = {};
		OBJECTS["Character"] = {};
		OBJECTS["Pet"] = {};

		PARTICLES = [];

		// Initialize all characters
		NPCS = {};
		CHARACTER = OBJECTS["Character"]; //shorthand
		CHARACTER[0] = new Character(PHYSICSWORLD, canvasWidth*0.5, canvasHeight*0.6, PROFILE, this.area, 0);
		
		PLAYER = CHARACTER[0];
		PLAYER.appear();
		PLAYER_CONTROLLER = new Player(CHARACTER[0]); // Initialize Player controller

		// HUD
		CHAT = MENUS["chatMenu"];
		CHAT.load();

		// Minigames
		MINIGAME = new MinigameState();

		this.loadArea(area, "initial"); // Actually load area
	}

	load () {

	}

	// Load Area data; loads background image & objects
	// (Area name, Name of previous area, function to call after loading is successful, playerId of owner of area (for coop), additional data (coop furniture))
	loadArea (area="hub", fromWarp, endFunc, ownerId=false, data) {
		// Owner of area
		if (area == "coop" && ownerId == false) {
			ownerId = NETPLAY.id;
		}

		this.oldArea = this.area;
		this.area = area;

		this.areaOwner = ownerId;

		// Transport player to new area
		PLAYER.area = this.area;
		let spawnX = canvasWidth*0.5;
		let spawnY = canvasHeight*0.6;
		if (fromWarp === "initial") {
			spawnX += Math.random()*8-4;
			spawnY += Math.random()*30;
		}
		PLAYER_CONTROLLER.reset(spawnX, spawnY, "down");
		
		// Clear any uneeded objects
		for (const [name, npc] of Object.entries(NPCS)) {
			// Delete all NPCs
			delete NPCS[name];
			delete OBJECTS["Character"][name];
		}
		OBJECTS["Warp"] = {};
		OBJECTS["Trigger"] = {};
		OBJECTS["Wall"] = {};
		OBJECTS["Wall"].dontUpdate = true;
		OBJECTS["Furniture"] = {};
		PHYSICSWORLD.clear();

		this.findPlayersInArea(this.area);

		PARTICLES = [];

		// Load Chicken Coop
		if (this.area == "coop") {
			// Furniture
			if (this.areaOwner == NETPLAY.id) {
				// Load your own furniture
				data = SAVEDATA.coop;
				Coop.load(data.furniture, this.areaOwner);
			} else {
				// Load other player's furniture
				console.log("Loading coop furniture", data);
				Coop.load(data.furniture, this.areaOwner);
			}
		}

		// Area graphics
		if (this.area == "coop" && data.theme) {
			// Custom coop background
			BACKGROUND[this.area] = new RenderImage(`assets/areas/${data.theme}.png`);
		} else {
			// Normal Area background
			BACKGROUND[this.area] = new RenderImage(`assets/areas/${this.area}.png`);
		}
		BACKGROUNDIMG[this.area] = {};
		BACKGROUNDSPRITE[this.area] = {};
		BACKGROUNDANIM[this.area] = {};

		// Load Area data
		//TimedEventsSystem.setActiveTimedEvents(["christmas", "midnight", "sunday"])
		loadJSON5(`assets/areas/${this.area}.json5`, (data) => {
			// Inject special timed event area data, if any
			TimedEventsSystem.injectTimedEvents(`areas/${this.area}`, data).then(newData => {
				// After all jsons have been read, finally load the area
				loadAreaFile(newData, this, fromWarp, endFunc);

				// Let server know player moved area
				NETPLAY.sendArea(area, ownerId, PLAYER.x, PLAYER.y);
			});
		});

		// Progress Quests
		QuestSystem.event("area", area); // Progress quests that look for areas

		// End loading screen
		LoadingScreen.start(() => {});
	}

	warpToArea (area, fromWarp, character, ownerId, data) {
		if (character == undefined) {
			character = PLAYER;
		}
		AudioSystem.fadeOutMusic(1);
		PLAYER.static = true; // Don't let player move when in the process of warping
		PLAYER_CONTROLLER.stop();
		NETPLAY.sendAction("disappear");
		Transition.start("iris", "out", 0.6, [character.x, character.y-40], () => {
			// Display black screen while area is loading...
			Transition.start("loading", "in", 100, null, null);
			// Actually start loading Area
			WORLD.loadArea(area, fromWarp, () => {
				// Transition in once loading is done
				Transition.start("iris", "in", 0.4, [character.x, character.y-40], () => {
					PLAYER.static = false; // Let player move after transition is done
				});
			}, ownerId, data);
		});
	}

	playMusic(music, position = 0) {
		if (music) {
			if (MUSIC[music]) {
				AudioSystem.playMusic(MUSIC[music]);
				// Seek to the specified position if provided
				if (position > 0) {
					MUSIC[music].seek(position);
				}
			} else {
				console.log("Music not found: " + music);
			}
		} else {
			AudioSystem.stopMusic();
		}
	}

	returnToArea() {
		// Return to area after minigame
		this.playMusic(this.areaMusic, this.areaMusicPosition);
	}

	// Register an object as part of the physics world
	spawnObject(name, obj, id) {
		if (id === undefined) {
			id = 0;
			while (OBJECTS[name].hasOwnProperty(id.toString())) {
				id++;
			}
		}
		OBJECTS[name][id] = obj;
		return obj;
	}

	update (dt) {
		// Area update
		if (this.area == "coop") {
			Coop.update(dt);
		}

		// Update objects
		PLAYER_CONTROLLER.update(dt);
		for (const [id, obj] of Object.entries(NPCS)) {
			obj.update(dt);
		}
		for (const [name, objList] of Object.entries(OBJECTS)) {
			let keysToDelete;
			for (const [id, obj] of Object.entries(objList)) {
				if (obj.update) {
					obj.update(dt);
				}
				// Remove deleted objects
				if (obj.DELETED) {
					if (!keysToDelete) { keysToDelete = []; }
					keysToDelete.push(id);
				}
			}
			if (keysToDelete) {
				keysToDelete.forEach(key => {
					delete objList[key];
				});
			}
		}
		updatePhysics(OBJECTS, PHYSICSWORLD, dt);

		NETPLAY.update(dt);

		// Particles
		// PARTICLES is an array, NOT an object
		for (let i = PARTICLES.length-1; i >= 0; i--) {
			let particle = PARTICLES[i];
			particle.update(dt);
			if (particle.DELETED) {
				PARTICLES.splice(i, 1);
			}
		}

		// Pet race
		if (this.area == "racetrack") {
			PetRaceSystem.update(dt);
		}
		
		// Dialogue box
		DialogueSystem.update(dt);

		// Background element animations
		for (const [i, anim] of Object.entries(BACKGROUNDANIM[this.area])) {
			anim.update(dt);
		}

		// HUD
		CHAT.update(dt);
	}

	draw () {
		// Background
		Draw.setColor(255,255,255);
		Draw.image(BACKGROUND[this.area], null, 0, 0); //sprite

		// Draw objects in the correct order
		let drawQueue = [];

		// Background elements
		for (const [i, sprite] of Object.entries(BACKGROUNDSPRITE[this.area])) {
			if (sprite.visible) {
				let isActive = true; // Is it disabled
				if (sprite.condition) {
					isActive = checkCondition(sprite.condition);
				}

				if (isActive) {
					drawQueue.push(sprite);
				}
			}
		}

		// Pet race
		if (this.area == "racetrack") {
			PetRaceSystem.draw();
		}

		// Draw objects
		for (const [id, obj] of Object.entries(CHARACTER)) {
			drawQueue.push(obj);
		}
		for (const [id, obj] of Object.entries(OBJECTS["Pet"])) {
			drawQueue.push(obj);
		}
		for (const [id, obj] of Object.entries(OBJECTS["Furniture"])) {
			if (obj.rug) {
				obj.draw(); // Always render rugs first (under everything)
			} else {
				drawQueue.push(obj);
			}
		}
		drawQueue.sort((a, b) => a.y - b.y);
		for (let i = 0; i < drawQueue.length; i++) {
			const obj = drawQueue[i];
			obj.draw();
		}

		// Particles
		for (const [id, obj] of Object.entries(PARTICLES)) {
			obj.draw();
		}

		// Draw player movement cursor
		PLAYER_CONTROLLER.draw();

		// Area Overlay
		if (this.area == "coop") {
			Coop.draw();
		}

		// NPC how speechBubble responses
		for (const [id, obj] of Object.entries(NPCS)) {
			obj.draw();
		}

		// Show action bubble above clickable elements like NPCs
		for (const [id, obj] of Object.entries(OBJECTS["Trigger"])) {
			obj.draw();
		}

		// Draw object overlays
		for (let i = 0; i < drawQueue.length; i++) {
			const obj = drawQueue[i];
			if (obj.drawOver) {
				obj.drawOver();
			}
		}

		// Dialogue box
		DialogueSystem.draw();

		// DEBUG physics
		if (DEBUGPHYSICS) {
			drawPhysics(Draw, OBJECTS, PHYSICSWORLD);

			// Display click triggers
			Draw.setColor(120,0,80,1.0);
			Draw.setLineWidth(3);
			for (const [id, obj] of Object.entries(OBJECTS["Trigger"])) {
				if (obj.clickable) {
					Draw.push();
					Draw.translate(obj.x, obj.y);
					Draw.polygon(obj.clickShape.v, "line");
					Draw.pop();
				}
			}

			// Display Corrdinates
			let [mouseX, mouseY] = getMousePos();
			Draw.setColor(255,255,255,1.0);
			Draw.setFont(FONT.caption, 4);
			Draw.text(`(${Math.floor(mouseX)}, ${Math.floor(mouseY)})`, mouseX+10, mouseY+20);
		}

		// HUD
		CHAT.draw();
	}

	// Received keyboard input
	keyPress(key, code) {
		// Do not do anything while transitioning
		if (Transition.playing()) {
			return true;
		}

		// Dialogue
		if (DialogueSystem.keyPress(key)) {
			return true;
		}

		// Area
		if (this.area == "coop") {
			if (Coop.keyPress(key)) {
				return true;
			}
		}

		// Control Player
		PLAYER_CONTROLLER.keyPress(key);
		
		CHAT.keyPress(key);
	}
	keyRelease(key, code) {
		// Area
		if (this.area == "coop") {
			if (Coop.keyRelease(key)) {
				return true;
			}
		}

		// Control Player
		PLAYER_CONTROLLER.keyRelease(key);
	}

	// Recieved mouse input
	mouseClick(button, x, y) {
		// Do not click while transitioning
		if (Transition.playing()) {
			return true;
		}

		// Chat Menu
		if (CHAT.mouseClick(button, x, y)) {
			return true;
		}

		// Dialogue
		if (DialogueSystem.mouseClick(button, x, y)) {
			return true;
		}
		
		// NPC speechBubble responses
		for (const [id, obj] of Object.entries(NPCS)) {
			if (obj.click(button, x, y)) {
				return true;
			}
		}

		// Area
		if (this.area == "coop") {
			if (Coop.mouseClick(button, x, y)) {
				return true;
			}
		}

		// Pet interaction
		for (const [id, obj] of Object.entries(OBJECTS["Pet"])) {
			if (obj.click(button, x, y)) {
				return true;
			}
		}
		
		// Click on click triggers
		for (const [id, obj] of Object.entries(OBJECTS["Trigger"])) {
			if (obj.click && obj.click(button, x, y)) {
				return true;
			}
		}

		// Control player by dragging mouse button on screen
		PLAYER_CONTROLLER.mouseClick(button, x, y);
	}

	mouseRelease(button, x, y) {
		CHAT.mouseRelease(button, x, y);

		// Dialogue
		if (DialogueSystem.mouseRelease(button, x, y)) {
			return true;
		}

		// NPC speechBubble responses
		for (const [id, obj] of Object.entries(NPCS)) {
			if (obj.clickRelease(button, x, y)) {
				return true;
			}
		}
		
		// Area
		if (this.area == "coop") {
			if (Coop.mouseRelease(button, x, y)) {
				return true;
			}
		}

		// Player
		PLAYER_CONTROLLER.mouseRelease(button, x, y);
	}

	mouseScroll(dy) {
		// Area
		if (this.area == "coop") {
			Coop.mouseScroll(dy);
		}
	}

	findPlayersInArea(area) {
		// Find all players that are in an area and add an object for them
		let players = [];
		if (!NETPLAY.playerList) {
			return [];
		}
		for (const [id, playerData] of Object.entries(NETPLAY.playerList)) {
			if (playerData.area == area || (this.areaOwner && playerData.area == `${area}:${this.areaOwner}`)) { // Player is in your area (either "area" or "area:owner")
				this.addPlayerToArea(id, playerData, false);
				players.push(playerData);
			} else {
				this.removePlayerFromArea(id);
			}
		}
		return players;
	}

	addPlayerToArea(id, playerData, appearAnimation) {
		// When a player joins an area, create a character object for them
		// First, check if player is in -your- area. If they aren't, remove or don't create their character object.
		let chicken = playerData.chicken;
		if (playerData.area == PLAYER.area || (this.areaOwner && playerData.area == `${PLAYER.area}:${this.areaOwner}`)) { // Player is in your area (either "area" or "area:owner")
			if (!CHARACTER[id]) {
				CHARACTER[id] = new Character(PHYSICSWORLD, chicken.x, chicken.y, playerData.profile, playerData.area, id);
				CHARACTER[id].area = playerData.area;
				//CHARACTER[id].active = false // Disable collision checks. Should be enabled so collision is accurate even when information isn't being recieved.
			}
			CHARACTER[id].setPosition(chicken.x, chicken.y);
			if (appearAnimation) {
				CHARACTER[id].appear();
			}
		} else { // Player is not in your area
			this.removePlayerFromArea(id);
		}
	}

	removePlayerFromArea(id) {
		// Remove player object
		if (CHARACTER[id]) {
			CHARACTER[id].destroy();
			delete CHARACTER[id];
		}
	}
};

const setDebugPhysics = (enabled) => {
	DEBUGPHYSICS = enabled;
};

import { WORLD } from "./main.js";

export { World, PHYSICSWORLD, OBJECTS, CHARACTER, PLAYER, PLAYER_CONTROLLER, NPCS, PARTICLES, CHAT, DEBUGPHYSICS, MINIGAME, setDebugPhysics };