// Store player data and game progress

function makeProfile() {
	const obj = JSON.parse(text);
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
		hat: 0,
		clothing: 0,
		money: 0,
		pet: false
	}

	let savedata = {
		items: [],
		house: [],
		furniture: []

	}
	
	return profile
}
