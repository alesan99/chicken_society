import DialogueSystem from "./dialogue.js";
import AudioSystem from "./engine/audio.js";
import QuestSystem from "./quests.js";
import Transition from "./transition.js";
import { checkCondition } from "./area.js";
import { addItem, getItem, addNuggets, removeNuggets } from "./savedata.js";
import {SAVEDATA, PROFILE, WORLD, NETPLAY, CURSOR} from "./main.js";
import { setState } from "./state.js";
import { PHYSICSWORLD, PLAYER, PLAYER_CONTROLLER, MINIGAME, OBJECTS, NPCS } from "./world.js";

const WorldEvent = (function() {
	const functions = {
		/**
		 * Causes something to happen to the player or the world.
		 * Used for triggers, dialogue events, quest rewards, etc.
		 * @param {Object|Object[]} event - An object or list of objects describing the event.
		 * @param {function} callback - (Optional) Function to be called
		 */
		event(event, callback, triggeredBy="event") {
			// Check if event is an array of multiple events
			if (Array.isArray(event)) {
				for (let e in event) {
					this.event(e, callback);
				}
				return;
			}

			// Check if event should trigger.
			if (event.condition) {
				if (!checkCondition(event.condition)) {
					return false;
				}
			}

			const name = event.name;

			if (name == "minigame") {
				// Start minigame
				// Does this trigger cost something?
				if (event.cost) {
					removeNuggets(event.cost);
				}

				AudioSystem.fadeOutMusic(1);
				WORLD.areaMusicPosition = AudioSystem.getMusicPosition();
				PLAYER_CONTROLLER.stop();
				PLAYER.static = true; // Don't let player move
				Transition.start("wipeLeft", "out", 0.8, null, () => {
					if (callback) callback(); // For reseting triggers, but doesn't really make sense for much else.
					setState(MINIGAME, event.minigameName); // Start minigame after transition
					Transition.start("wipeRight", "in", 0.8, null, null);
				});
			} else if (name == "quest") {
				// Progress quest
				if (event.questTaskAdd) {
					QuestSystem.progress(event.quest, event.questTask, event.questTaskAdd);
				} else if (event.questTaskSet) {
					QuestSystem.setProgress(event.quest, event.questTask, event.questTaskSet);
				}
			} else if (name == "dialogue") {
				// Start dialogue
				DialogueSystem.start(event.dialogue);
				if (callback) callback();  // For reseting triggers.
			} else if (name == "warp") {
				// Warp to another area
				WORLD.warpToArea(event.area, event.fromWarp || triggeredBy, PLAYER);
			} else if (name == "giveItem") {
				// Give item
				addItem(event.item);
			} else if (name == "giveNuggets") {
				// Nuggets
				addNuggets(event.nuggets);
			} else if (name == "startQuest") {
				// Start new quest
				QuestSystem.start(event.quest);
			}
		}
	};
	
	return functions; })();

export { WorldEvent };