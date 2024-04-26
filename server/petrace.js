// Pet racing & betting minigame

class PetRace {
	constructor() {
		this.started = false;

		this.pets = {}

		this.bets = {}
	}

	addPet(id, pet) {
		this.pets[id] = pet
	}

	removePet(id) {
		delete this.pets[id]
	}

	placeBet(id, amount) {
		this.bets[id] = amount
	}

	start() {
		this.started = true;
	}

	update(dt) {
		if (!this.started) {
			return false;
		}
	}

	end() {
		this.started = false;
	}
}

class PetRacer {
	constructor(itemId, name="", owner="") {
		this.itemId = itemId
		this.name = name
		this.owner = owner
	}
}