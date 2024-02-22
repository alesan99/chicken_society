// Store player data and game progress
// SaveData: Stores all player data & game progress, including private data (Excluding login information)
// Profile: Stores only chicken information; this is information that's always accessible to other players

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
			pet: {"pillbug": 1}
		},
		nuggets: 100,
		
		house: [],

		// Equipped pet status
		// Persists between play sessions, but only stored for 1 pet at a time
		pet: {
			name: "",
			happiness: 0.8, // 0-1
			health: 1, // 0-1
			hunger: 1, // 0-1
			age: 0, // in days
			disease: false
		},

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
			runner: 0
		}
	}

	return saveData
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
	]

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
	}
	
	return profile
}

// Saving SaveData
function saveSaveData(saveData) {
	// Store data to browser storage
	// This is for guests who have not made an account

	// Convert the object to a JSON string
	const jsonString = JSON.stringify(saveData);
	
	// Store the JSON string in localStorage
	localStorage.setItem("guestSaveData", jsonString);
	console.log("saved SaveData to localStorage at 'guestSaveData'")
}

function loadSaveData(saveData) {
	// Load data from browser storage
	// This is for guests who have not made an account

	// Retrieve the JSON string from localStorage
	const storedJsonString = localStorage.getItem("guestSaveData");

	if (!storedJsonString) {
		console.log("could not get localStorage data at 'guestSaveData'")
		return false
	}
	
	// Parse the JSON string back into a JavaScript object
	const retrievedObject = JSON.parse(storedJsonString);
	// TODO: insert elements from retrievedObject into the default saveData so there isn't missing information if the saveData format is changed in a game update.

	QuestSystem.initialize() // Reload quests

	console.log("loaded SaveData from localStorage at 'guestSaveData'")
	console.log(retrievedObject)
	return retrievedObject
}

// Functions for modifying save data:
// Remove nugget currency.
function removeNuggets(nuggets) {
	SAVEDATA.nuggets -= nuggets

	// Play nugget animation in HUD
	if (CHAT) {
		CHAT.nuggetCounter(-nuggets)
	}
}

function addNuggets(nuggets) {
	SAVEDATA.nuggets += nuggets

	// Play nugget animation in HUD
	if (CHAT) {
		CHAT.nuggetCounter(nuggets)
	}
}

function spendNuggets(cost) {
	if (SAVEDATA.nuggets >= cost) {
		removeNuggets(cost)
		return true
	} else {
		return false
	}
}

// Get items like clothing and consumables
function addItem(type, id) {
	if (!type) {
		// Item category not specified, look for it
		type = getItemCategory(id)
	}
	if (!SAVEDATA.items[type][id]) {
		SAVEDATA.items[type][id] = 0
	}
	SAVEDATA.items[type][id] += 1
}

function removeItem(type, id) {
	if (!SAVEDATA.items[type][id]) {
		SAVEDATA.items[type][id] = 0
	}
	SAVEDATA.items[type][id] -= 1
}

function getItemCategory(id) {
	for (const cat in ITEMS) {
		if (ITEMS[cat][id]) {
			return cat
		}
	}
	return "item"
}

function getItemData(id, type) {
	let category
	if (type) {
		category = type
	} else {
		category = getItemCategory(id)
	}

	return ITEMS[category][id]
}

// Color storage methods
function RGBtoHEX(r, g, b) {
	// Convert each RGB component to a two-digit hexadecimal value
	const hexR = r.toString(16).padStart(2, '0');
	const hexG = g.toString(16).padStart(2, '0');
	const hexB = b.toString(16).padStart(2, '0');

	// Combine the hexadecimal values to form the final color code
	const hexColor = `#${hexR}${hexG}${hexB}`;

	return hexColor;
}

function HEXtoRGB(hex) {
	// Remove the '#' symbol
	hex = hex.substring(1, 7);

	// Split the hex string into three parts: red, green, and blue
	const red = parseInt(hex.substring(0, 2), 16);
	const green = parseInt(hex.substring(2, 4), 16);
	const blue = parseInt(hex.substring(4, 6), 16);

	// Return the RGB values as an object
	return [red, green, blue];
}