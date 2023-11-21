// Store player data and game progress
// SaveData: Stores all player data & game progress, including private data (Excluding login information)
// Profile: Stores only chicken information; this is information that's always accessible to other players

function makeSaveData() {
	let saveData = {
		// Chicken customization
		profile: makeProfile(),

		// All owned items
		items: {
			head: {},
			face: {},
			body: {},
			furniture: {},
			item: {}
		},
		nuggets: 100,
		
		pets: [],
		house: [],

		quests: {
			// Quest progress
			// Each quest progress is a list of numbers Ex: [0, 0, 1]
			// They will be marked as complete once the list matches or exceeds the predefined quest requirements
			active: {
				tutorial: [],
				runner_highscore: []
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
		color: [
			Math.floor(100 + Math.random()*155),
			Math.floor(100 + Math.random()*155),
			Math.floor(100 + Math.random()*155)
		],
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

	console.log("loaded SaveData from localStorage at 'guestSaveData'")
	console.log(retrievedObject)
	return retrievedObject
}

// Functions for modifying save data:
// Remove nugget currency. TODO: Fancy animations
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