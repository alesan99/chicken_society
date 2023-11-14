// Store player data and game progress
// SaveData: Stores all player data & game progress, including private data (Excluding login information)
// Profile: Stores only chicken information; this is information that's always accessible to other players

function makeSaveData() {
	let saveData = {
		// Chicken customization
		profile: makeProfile(),

		// All owned items
		hats: ["none"],
		accessories: ["none"],
		furniture: [],
		items: [],
		
		pets: [],


		house: [],
		nuggets: 10,

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
		hat: false,
		accessory: false,
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
}

function addNuggets(nuggets) {
	SAVEDATA.nuggets += nuggets
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
	let category = "items"
	if (type == "hat") {
		category = "hats"
	} else if (type == "accessory") {
		category = "accessories"
	} else if (type == "furniture") {
		category = "furniture"
	}
	SAVEDATA[category].push(id)
}

function removeItem(type, id) {
	let category = "items"
	if (type == "hat") {
		category = "hats"
	} else if (type == "accessory") {
		category = "accessories"
	} else if (type == "furniture") {
		category = "furniture"
	}
	const indexToRemove = SAVEDATA[category].indexOf(id)

	if (indexToRemove !== -1) {
		SAVEDATA[category].splice(indexToRemove, 1);
	}
}

function getItemData(id, type) {
	let category
	if (type) {
		category = type
	} else {
		for (const cat in ITEMLIST) {
			if (ITEMLIST[cat].includes(id)) {
				category = cat
				break
			}
		}
	}

	if (category == "hat") {
		return HAT[id]
	} else if (type == "accessory") {
		return ACCESSORY[id]
	} else if (type == "furniture") {
		return FURNITURE[id]
	} else {
		return ITEM[id]
	}
}