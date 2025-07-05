// Store player data and game progress
// SaveData: Stores all player data & game progress, including private data (Excluding login information)
// Profile: Stores only chicken information; this is information that's always accessible to other players

import { ITEMS } from "./assets.js";
import { SAVEDATA, NETPLAY, PROFILE } from "./main.js"; // TODO: Remove circular dependency
import { PLAYER } from "./world.js"; // TODO: Remove circular dependency
import { CHAT } from "./world.js";
import { MENUS } from "./menu.js";
import QuestSystem from "./quests.js";
import AudioSystem from "./engine/audio.js";
import { RGBtoHEX, HEXtoRGB } from "./lib/color.js";
import Notify from "./gui/notification.js";

function makeSaveData() {
	let saveData = {
		// Chicken customization
		profile: makeProfile(),

		lastPlayed: Date.now(),

		// All owned items
		// Format: head: {"name_of_hat": 1, ...}
		items: {
			head: {},
			face: {},
			body: {},
			item: {},

			furniture: {},
			pet: {}
		},
		nuggets: 100,
		
		// Coop furniture
		// [
		// 	{id: "table", x: 0, y: 0, dir: "down"},
		// ]
		coop: {
			theme: false,
			furniture: []
		},

		// Equipped pet status
		// Persists between play sessions, but only stored for 1 pet at a time
		pet: makePetData(),

		quests: {
			// Quest progress
			// Each quest progress is a list of numbers Ex: [0, 0, 1]
			// They will be marked as complete once the list matches or exceeds the predefined quest requirements
			// NOTE: the quests listed below are just examples. Quests will be added to the saveData list automatically, not typed in manually.
			active: {
				// tutorial: [],
				// runner_highscore: []
			},
			// Completed quests will save the finished quest progress to compare with possible future updates
			completed: {

			}
		},

		highscores: {
			runner: 0,
			eggs: 0
		},

		// Settings
		settings: {
			volume: 0.25,
			musicVolume: 1.0,
			sfxVolume: 1.0
		}
	};

	return saveData;
}

function makeProfile() {
	let defaultNames = ["Orpington",
		"Polish chicken",
		"Henny Penny",
		"Leghorn",
		"Barred Rocks",
		"Drumstick",
		"Silkie",
		"Cochin",
		"Wyandotte",
		"Cluck Norris",
		"Hen Solo",
		"Henrietta",
		"Australorp",
		"Foghorn Leghorn",
		"Frizzle",
		"Yolko Ono",
		"Hank",
		"Cooper",
		"Goldie",
		"Rosie",
		"Gladys",
		"Buckbeak",
		"Sussex",
		"Princess lay A",
		"Bitchass Jessica"
	];

	let profile = {
		name: defaultNames[Math.floor(Math.random()*defaultNames.length)],
		color: RGBtoHEX(
			Math.floor(100 + Math.random()*155),
			Math.floor(100 + Math.random()*155),
			Math.floor(100 + Math.random()*155)
		),
		head: false,
		face: false,
		body: false,
		item: false,

		pet: false
	};
	
	return profile;
}

function makePetData() {
	return {
		name: "", // Custom name of pet
		id: "", // Item ID of pet
		happiness: 0.8, // 0-1
		health: 1, // 0-1
		hunger: 1, // 0-1
		age: 0, // in days
		lastUpdate: 0, // timestamp of last update
		disease: false
	};
}

// Saving SaveData
function saveSaveData(saveData, callback) {
	// Store data to browser storage
	// This is for guests who have not made an account

	// Convert the object to a JSON string
	const jsonString = JSON.stringify(saveData);
	
	if (NETPLAY.id == "OFFLINE") {
		// Store the JSON string in localStorage
		localStorage.setItem("guestSaveData", jsonString);
		console.log("saved SaveData to localStorage at 'guestSaveData'");
		if (callback) callback();
	} else {
		// Save to server
		NETPLAY.sendSaveData(saveData, () => {
			console.log("saved SaveData to server");
			if (callback) callback();
			Notify.new("Saved!", 3);
		});
	}
}

function autoSave(saveData, callback) {
	if (NETPLAY.id == "OFFLINE") {
		//saveSaveData(saveData, callback);
	} else {
		const currentTime = new Date();
		const lastSaved = NETPLAY.lastSaved;
		const autoSaveWaitTime = NETPLAY.autoSaveWaitTime;
		if (!lastSaved || ((currentTime - lastSaved) / 1000) >= autoSaveWaitTime) {
			saveSaveData(saveData, callback);
		}
	}
}

function loadSaveData(callback) {
	// Load data from browser storage
	// This is for guests who have not made an account
	const useSaveData = function(data) {
		console.log(data);
		callback(data);
	};

	// Retrieve the JSON string from localStorage
	let storedJsonString;
	
	if (NETPLAY.id == "OFFLINE") {
		storedJsonString = localStorage.getItem("guestSaveData");

		if (!storedJsonString) {
			console.log("Could not get localStorage data at 'guestSaveData'.");
			return false;
		}
		
		// Parse the JSON string back into a JavaScript object
		const retrievedObject = JSON.parse(storedJsonString);
		console.log("Loaded SaveData from localStorage at 'guestSaveData'.");
		useSaveData(retrievedObject);
	} else {
		// Load from server
		storedJsonString = NETPLAY.requestSaveData((data) => {
			if (data === false) {
				console.log("Could not get SaveData from server");
				return false;
			}
			// SaveData loaded successfully
			console.log("Loaded SaveData from server.");
			useSaveData(data);
			Notify.new("Loaded!", 3);
		});
	}
}

function applySaveData(data) {
	// TODO: insert elements from retrievedObject into the default saveData so there isn't missing information if the saveData format is changed in a game update.
	replaceObjectValues(PROFILE, data.profile);
	replaceObjectValues(SAVEDATA, data);
	SAVEDATA.profile = PROFILE;
	console.log(PROFILE, SAVEDATA.profile);
	PLAYER.updateProfile(PROFILE, "sendToServer");
	applySettings();
	QuestSystem.initialize(); // Reload quests
}

function replaceObjectValues(objectTo, objectFrom) {
	// Replace all values in objectTo with values from objectFrom
	// This is needed to prevent references to old objects
	for (const key in objectFrom) {
		objectTo[key] = objectFrom[key];
	}
}

// Functions for modifying save data:
// Remove nugget currency.
function removeNuggets(nuggets) {
	SAVEDATA.nuggets -= nuggets;

	// Play nugget animation in HUD
	if (CHAT) {
		CHAT.nuggetCounter(-nuggets);
	}
	// Quest progression
	QuestSystem.event("nuggets", SAVEDATA.nuggets);
}

function addNuggets(nuggets) {
	SAVEDATA.nuggets += nuggets;

	// Play nugget animation in HUD
	if (CHAT) {
		CHAT.nuggetCounter(nuggets);
	}
	// Quest progression
	QuestSystem.event("nuggets", SAVEDATA.nuggets);
}

function spendNuggets(cost) {
	if (SAVEDATA.nuggets >= cost) {
		removeNuggets(cost);
		return true;
	} else {
		return false;
	}
}

// Get items like clothing and consumables
function addItem(id, type, count=1) {
	if (!type) {
		// Item category not specified, look for it
		type = getItemCategory(id);
	}
	if (!SAVEDATA.items[type][id]) {
		SAVEDATA.items[type][id] = 0;
	}
	SAVEDATA.items[type][id] += count;

	// Quest progression
	QuestSystem.event("getItem", id, SAVEDATA.items[type][id]);

	// New item notification
	MENUS["chatMenu"].notification("customization", true);

	autoSave(SAVEDATA);
}

function removeItem(id, type, count=1) {
	if (!type) {
		// Item category not specified, look for it
		type = getItemCategory(id);
	}
	if (!SAVEDATA.items[type][id]) {
		return false;
	}
	SAVEDATA.items[type][id] -= count;
	if (SAVEDATA.items[type][id] <= 0) {
		delete SAVEDATA.items[type][id];
	}

	autoSave(SAVEDATA);
}

function getItemCategory(id) {
	for (const cat in ITEMS) {
		if (ITEMS[cat][id]) {
			return cat;
		}
	}
	return "item";
}

function getItemData(id, type) {
	// Get item data
	let category;
	if (type) {
		category = type;
	} else {
		category = getItemCategory(id);
	}

	return ITEMS[category][id];
}

function getItem(id, type) {
	// Get number of owned items
	let category;
	if (type) {
		category = type;
	} else {
		category = getItemCategory(id);
	}
	if (category && SAVEDATA.items[category][id]) {
		return SAVEDATA.items[category][id];
	} else {
		return false;
	}
}

// Chicken Coop Furniture
function placeFurniture(itemId, x, y, dir="down") {
	// Add to list of furniture in player's coop
	SAVEDATA.coop.furniture.push({id: itemId, x: x, y: y, dir: dir});
}

function removeFurniture(itemId, x, y) {
	// Look for furniture in savedata that matches the given furniture info
	for (let i=0; i<SAVEDATA.coop.furniture.length; i++) {
		if (SAVEDATA.coop.furniture[i].id == itemId && SAVEDATA.coop.furniture[i].x == x && SAVEDATA.coop.furniture[i].y == y) {
			SAVEDATA.coop.furniture.splice(i, 1);
			return true;
		}
	}
	return false;
}

function applySettings() {
	AudioSystem.setVolume(
		SAVEDATA.settings.volume,
		SAVEDATA.settings.musicVolume,
		SAVEDATA.settings.sfxVolume
	);
}

export {makeSaveData, makeProfile, makePetData, saveSaveData, loadSaveData, autoSave, applySaveData, removeNuggets, addNuggets, spendNuggets, addItem, removeItem, getItemCategory, getItemData, getItem, placeFurniture, removeFurniture, RGBtoHEX, HEXtoRGB, replaceObjectValues, applySettings};