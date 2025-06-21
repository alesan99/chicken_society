// Area
// logic that controls the background and elements of an area

import { SAVEDATA, PROFILE, WORLD, NETPLAY, CURSOR } from "./main.js";
import { PHYSICSWORLD, PLAYER, PLAYER_CONTROLLER, MINIGAME, OBJECTS, NPCS } from "./world.js";
import AudioSystem from "./engine/audio.js";
import { BACKGROUNDIMG, BACKGROUNDSPRITE, BACKGROUNDANIM } from "./assets.js";
import { RenderImage } from "./engine/render.js";
import { Sprite, DrawableSprite, Animation } from "./engine/sprite.js";
import { setState } from "./state.js";
import { addItem, removeNuggets } from "./savedata.js";
import QuestSystem from "./quests.js";
import DialogueSystem from "./dialogue.js";
import Transition from "./transition.js";
import { PhysicsObject, Character, Player, NPC, Pet, Trigger, Wall, Warp, Furniture, Particle } from "./objects/objects.js";


// Load area data from .json
function loadAreaFile(data, world, fromWarp, endFunc) {
	let area = world.area;
	let fromArea = world.oldArea;

	// Get general information
	world.areaName = data.name || "???";
	world.areaMapLocation = data.mapLocation || false;

	// Load music
	world.areaMusic = data.music;
	world.playMusic(data.music);

	// Load area walls
	// Go through each polygon & make wall
	if (data.walls) {
		let i = 0;
		for (const poly of data.walls) {
			// Create wall object
			i++;
			OBJECTS["Wall"][i] = new Wall(PHYSICSWORLD, ...poly);
		}
	}
	// Load warps
	if (data.warps) {
		for (const [name, warp] of Object.entries(data.warps)) {
			OBJECTS["Warp"][name] = new Warp(PHYSICSWORLD, warp.to, warp.from, name, warp.fromWarp, warp.facing, warp.x, warp.y, warp.w, warp.h, warp.sound);
		}
		
		// Get spawn location
		for (const [i, obj] of Object.entries(OBJECTS["Warp"])) {
			if ((obj.fromWarp && obj.fromWarp == fromWarp) || (obj.fromArea && obj.fromArea == fromArea)) {
				PLAYER_CONTROLLER.reset(obj.frontx, obj.fronty+PLAYER.shape.h/2, obj.facing);
			}
		}
	}
	// Load NPCS
	if (data.NPCs) {
		for (const [name, npc] of Object.entries(data.NPCs)) {
			let isActive = true; // If it belongs to a quest, make sure its active
			if (npc.condition) {
				isActive = checkCondition(npc.condition);
			}
			if (isActive) {
				OBJECTS["Character"][name] = new Character(PHYSICSWORLD, npc.x, npc.y, npc.profile, area, null);
				NPCS[name] = new NPC(OBJECTS["Character"][name], npc.speechBubble, npc.facing, npc.roamRadius, npc.interactRange, {shop: npc.shop, dialogue: npc.dialogue}, npc.image);
				NPCS[name].condition = npc.condition;
			}
		}
	}
	
	// Load triggers
	if (data.triggers) {
		for (const [name, trig] of Object.entries(data.triggers)) {
			let isActive = true; // If it belongs to a quest, make sure its active
			if (trig.condition) {
				isActive = checkCondition(trig.condition);
			}

			//if (isActive) {
			let func = false;
			// trig.action is a string describing what the trigger should do, create a function based on that
			let action = trig.action;
			if (trig.cost && trig.icon) { // apply cost to icon text
				trig.icon.text = trig.cost;
			}
			OBJECTS["Trigger"][name] = new Trigger(PHYSICSWORLD, trig.x, trig.y, trig.shape, null, trig.clickable, trig.icon, trig.walkOver, trig.activateOnce, trig.sound);
			OBJECTS["Trigger"][name].active = isActive;
			OBJECTS["Trigger"][name].condition = trig.condition;
				
			// TODO: Put this code somewhere else (area.js?)
			if (action == "minigame") {
				// Start minigame
				func = function() {
					// Does this trigger cost something?
					if (trig.cost) {
						removeNuggets(trig.cost);
					}

					AudioSystem.fadeOutMusic(1);
					world.areaMusicPosition = AudioSystem.getMusicPosition();
					PLAYER_CONTROLLER.stop();
					PLAYER.static = true; // Don't let player move
					Transition.start("wipeLeft", "out", 0.8, null, () => {
						OBJECTS["Trigger"][name].reset();
						setState(MINIGAME, trig.minigameName); // Start minigame after transition
						Transition.start("wipeRight", "in", 0.8, null, null);
					});
				};
			} else if (action == "quest") {
				// Progress quest
				func = function() {
					if (trig.questTaskAdd) {
						QuestSystem.progress(trig.quest, trig.questTask, trig.questTaskAdd);
					} else if (trig.questTaskSet) {
						QuestSystem.setProgress(trig.quest, trig.questTask, trig.questTaskSet);
					}
				};
			} else if (action == "dialogue") {
				// Start dialogue
				func = function() {
					DialogueSystem.start(trig.dialogue);
					OBJECTS["Trigger"][name].reset();
				};
			} else if (action == "warp") {
				// Warp to another area
				func = function() {
					WORLD.warpToArea(trig.area, name, PLAYER);
				};
			} else if (action == "item") {
				// Give item
				addItem(trig.item);
			}

			OBJECTS["Trigger"][name].action = func;
				
			// inject sprite into sprites list
			if (trig.sprite) {
				let sprite = trig.sprite;
				// inherit trigger properties
				if (!sprite.x) {
					sprite.x = trig.x;
					sprite.y = trig.y;
				}
				sprite.condition = trig.condition;
				if (!data.sprites) { data.sprites = {}; }
				data.sprites[name] = sprite;
			}
			//}
		}
	}
	
	// Load additional Sprites & Animations
	if (data.sprites) {
		for (const [name, s] of Object.entries(data.sprites)) {
			let img = s.image;
			if (!(s.quest && !QuestSystem.getQuest(s.quest))) { // If it belongs to a quest, make sure its active
				if (!BACKGROUNDIMG[area][img]) {
					BACKGROUNDIMG[area][img] = new RenderImage(`assets/areas/${img}`);
				}
				let sprite = new Sprite(BACKGROUNDIMG[area][img], s.framesx, s.framesy, s.w, s.h, s.ox, s.oy, s.sepx, s.sepy);
				BACKGROUNDSPRITE[area][name] = new DrawableSprite(sprite, null, s.x, s.y, s.worldy);
				// Conditional visiblity
				if (s.condition) {
					BACKGROUNDSPRITE[area][name].condition = s.condition;
				}
				// If defined, play animation
				if (s.anim) {
					BACKGROUNDANIM[area][name] = new Animation(sprite, 0, 0);
					BACKGROUNDANIM[area][name].playAnimation(s.anim.frames, s.anim.delay, null);
					BACKGROUNDSPRITE[area][name].anim = BACKGROUNDANIM[area][name];
				}
			}
		}
	}

	// Call function passed to loadArea after loading is successful
	if (endFunc) {
		endFunc();
	}
}

// A "condition" is a property for sprites, triggers, and dialogue options
// It determines if the element should activate if the conditions are met
// Example: "egg" should only appear in an area if the egg Quest is active
function checkCondition(c) {
	if (c.quest) {
		let questName = c.quest;
		if (c.questComplete != null) {
			// "questComplete" just checks if the quest has ever been completed
			// Setting it to false will check if it has never been completed
			let questCompleted = SAVEDATA.quests.completed[questName];
			if (c.questComplete === true && questCompleted) { // Quest must be complete
				return true;
			} else if (c.questComplete === false && !questCompleted) { // Quest must not be complete
				return true;
			}
			return false;
		} else if (c.questActive != null) {
			// Check if quest is not active
			console.log(c.questActive);
			let questActive = QuestSystem.getQuest(questName);
			if (c.questActive === true && questActive) { // Quest must be active
				return true;
			} else if (c.questActive === false && !questActive) { // Quest must not be active
				return true;
			}
			return false;
		} else if (QuestSystem.getQuest(questName)) {
			// Quest is active; make sure progress conditions are met
			let progressMet = true;

			if (c.questTask != null) {
				let task = c.questTask;
				let value = c.questTaskValue;
				// Check if task is a list of values
				if (!Array.isArray(task)) {
					// turn it into a list for code simplicity
					task = [task];
					value = [value];
				}
				for (let i=0; i<task.length; i++) {
					if (QuestSystem.getProgress(questName, task[i]) != value[i]) {
						progressMet = false;
					}
				}
			}

			return progressMet;
		} else {
			// condition not met
			return false;
		}
	}
	if (c.item) {
		// Check if player has item
		let itemCount = SAVEDATA.items[c.item];
		if (itemCount) {
			return true;
		} else {
			return false;
		}
	}
	if (c.isResponse) {
		// Do not activate this response through normal means
		return false;
	}
	if (c.petRaceStarted) {
		// Condition is met if pet race is currently active (GOOD code)
		if (NETPLAY.petRaceStarted) {
			return true;
		}
		return false;
	}
	if (c.hasPet != null) {
		// Condition is met if player has this pet equipped
		let pet = PROFILE.pet;
		if (c.hasPet === true && pet) {
			return true;
		} else if (c.hasPet === false && !pet) {
			return true;
		}
		return false;
	}
	return true; // No condition was defined, so just activate it anyway
}

// Check all objects with conditions to make sure they are up to date
// Call this every time something may change the results of their condition checks (like quest progression)
function conditionsUpdate() {
	for (const [name, trig] of Object.entries(OBJECTS["Trigger"])) {
		if (trig.condition) {
			let isActive = checkCondition(trig.condition);
			trig.active = isActive;
		}
	}
}

export { loadAreaFile, checkCondition, conditionsUpdate };