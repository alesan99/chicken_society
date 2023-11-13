// Store player data and game progress

function makeProfile() {
	let names = ["Orpington",
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
		name: names[Math.floor(Math.random()*names.length)],
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

function makeSaveData() {
	let saveData = {
		hats: ["none"],
		accessories: ["none"],
		items: [],
		
		pets: [],

		items: [],
		house: [],
		furniture: [],
		nuggets: 10,

		highscores: {
			runner: 0
		}
	}

	return saveData
}

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
	}
	SAVEDATA[category].push(id)
}

function removeItem(type, id) {
	let category = "items"
	if (type == "hat") {
		category = "hats"
	} else if (type == "accessory") {
		category = "accessories"
	}
	const indexToRemove = SAVEDATA[category].indexOf(id)

	if (indexToRemove !== -1) {
		SAVEDATA[category].splice(indexToRemove, 1);
	}
}