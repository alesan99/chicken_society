// Pet racing & betting minigame

const {io, playerList} = require("../server.js");

class PetRaceClass {
	constructor() {
		this.started = false;

		this.maxPets = 1;

		this.waitTime = 60; // sec
		this.waitTimer = false;

		this.pets = [];
		this.pool = 0;
		this.bets = {};

		this.updateInterval = 1/30; // ms
		this.updateTimer = 0;

		this.area = "racetrack";
	}

	addPet(id, pet, name="No Name") {
		// Don't add if race started
		if (this.started) {
			return false;
		}

		this.pets.push(new PetRacer(pet, name, id));

		// Allow up to 4 pets
		if (Object.keys(this.pets).length >= this.maxPets) {
			this.start();
			return false;
		}

		// Wait a set amount of time so players can join and bet
		if (!this.waitTimer) {
			this.waitTimer = this.waitTime;
		}

		return true;
	}

	removePet(id) {
		delete this.pets[id]
	}

	placeBet(id, amount, petNo) {
		this.pool += amount; // Add to nugget pool
		this.bets[id] = petNo; // Bet on petNo

		return true;
	}

	start() {
		this.started = true;

		this.waitTimer = false;
	}

	update(dt) {
		// Wait for players to join
		if (this.waitTimer) {
			this.waitTimer -= dt;
			if (this.waitTimer <= 0) {
				this.start();
			}
		}

		if (!this.started) {
			return false;
		}

		// Move pets
		let finished = false;
		for (let peti in this.pets) {
			let pet = this.pets[peti];
			pet.pos += Math.random() * pet.drive * 10 * dt;
			if (pet.pos >= 100) {
				finished = peti;
				break;
			}
		}
		
		this.updateTimer += dt;
		if (this.updateTimer >= this.updateInterval) {
			let data = [];
			for (let pet in this.pets) {
				data.push([this.pets[pet].itemId,this.pets[pet].name,this.pets[pet].pos,0]);
			}
			io.to(`area:${this.area}`).emit("petRaceData", data);
			this.updateTimer = 0;
		}

		if (finished) {
			this.end(finished)
		}
	}

	end(winnerId) {
		this.started = false;
		io.to(`area:${this.area}`).emit("notify", `Race has ended. ${this.pets[winnerId].name} has won!`, 8);

		let playerId = this.pets[winnerId].owner;

		// Pay out bets
		// See which bets won, then split the pool between them
		let winningBets = [];
		for (let betId in this.bets) {
			if (betId == playerId) {
				winningBets.push(betId);
			}
		}
		let winnings = this.pool / winningBets.length;
		for (let betId in winningBets) {
			io.to(betId).emit("notify", `You won ${winnings} nuggets!`, 8);
			// playerList[bet].money += winnings;
		}
		
		io.to(`area:${this.area}`).emit("petRaceData", false);

		this.pets = [];
		this.pool = 0;
		this.bets = {};
	}

	// debug
	status() {
		console.log(
`Started: ${this.started}
Pets: ${this.pets}
Bets: ${this.bets}`)
	}
}

class PetRacer {
	constructor(itemId, name="", owner="") {
		this.itemId = itemId;
		this.name = name;
		this.owner = owner;

		this.pos = 0; // 0-100

		this.drive = 1 + Math.random()*0.1;

		this.speed = 0;
	}

	// debug
	toString() {
		let playerData = playerList[this.owner];
		return `PetRacer: ${this.name} (Owner: ${playerData.name})`;
	}
}

module.exports = {PetRaceClass};