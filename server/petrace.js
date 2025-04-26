// Pet racing & betting minigame

const {io, playerList} = require("../server.js");

class PetRaceClass {
	constructor() {
		this.started = false; // Has race started?
		this.placeCounter = 0; // Keeps track of how many pets have been placed
		this.allFinished = false; // Have all pets finished?
		this.allFinishedTimer = 0;
		this.allFinishedTime = 1; // How much time is spend after all pets have finished

		this.maxPets = 4;

		this.waitTime = 30; // sec
		this.waitTimer = false;

		this.pets = [];
		this.playersJoined = [];
		this.bets = {};

		this.updateInterval = 1/15; // ms
		this.updateTimer = 0;

		this.area = "racetrack"; // This is the one location where pet races happen.
	}

	addPet(id, itemId, name="No Name", force) {
		// Don't add if race started
		if (!force && this.started) {
			return false;
		}
		
		// Don't add if
		if (!force && this.playersJoined.includes(id)) {
			io.to(id).emit("notify", "You can't join again.", 8);
			return false;
		}

		this.pets.push(new PetRacer(itemId, name, id));
		this.playersJoined.push(id);

		// Allow up to 4 pets
		// If number of pets has reached the max, start race
		// If (force), add pet anyway
		if (!force && this.pets.length >= this.maxPets) {
			if (!this.started) {
				this.start();
			}
			return false;
		}

		// Wait a set amount of time so players can join and bet
		if (!this.waitTimer) {
			this.waitTimer = this.waitTime;
		}

		// Notify player that their pet is in
		let playerData = playerList[id];
		if (playerData) {
			io.to(id).emit("notify", `Your pet is in! The race will begin in ${Math.floor(this.waitTime)} seconds.`, 8);
		}

		return true;
	}

	removePet(id) {
		delete this.pets[id];
	}

	placeBet(id, amount, petNo) {
		// Check if they can't bet
		if (this.bets[id]) { // Player has already bet
			io.to(id).emit("notify", "You can't bet again.", 8);
			return false;
		} else if (this.started || this.pets.length === 0) { // Race has started or no pets
			io.to(id).emit("notify", "You can't bet right now.", 8);
			return false;
		}

		this.bets[id] = {
			i: petNo, // Bet on petNo
			amount: amount // How much was bet
		};
		io.to(id).emit("addNuggets", -amount); // Take away nuggets

		return true;
	}

	start() {
		// Add random pets if there isn't enough
		if (this.pets.length < this.maxPets) {
			let pets = ["pillbug"];
			let names = ["Subject #312", "Subject #882", "Subject #910", "Subject #808"];
			for (let i = this.pets.length; i < this.maxPets; i++) {
				// Pick random name
				let pet = pets[Math.floor(Math.random() * pets.length)];
				let name = names[Math.floor(Math.random() * names.length)];
				this.addPet("server", pet, name, true);
			}
		}

		// Start moving

		this.started = true;

		this.waitTimer = false;
	}

	update(dt) {
		// Wait for players to join
		if (this.waitTimer) {
			let oldWaitTimer = this.waitTimer;
			this.waitTimer -= dt;
			// Notify players that race is about to start
			if (this.waitTimer < 5 && !(oldWaitTimer < 5)) {
				io.to(`area:${this.area}`).emit("notify", "The race will start in 5 seconds!", 5);
			}
			// Start
			if (this.waitTimer <= 0) {
				this.start();
			}
		}

		// if (!this.started) {
		// 	return false;
		// }

		// Move pets
		if (this.started) {
			for (let peti in this.pets) {
				let pet = this.pets[peti];
				// If pet has finished...
				if (pet.finished) {
					pet.speed = 0;
					// Jumping code here...
					if (pet.place == 0) {
						if (pet.y == 0) {
							pet.sy = -80;
						}
					}
				} else {
					// Change speed at random intervals
					pet.speedChangeTimer += dt;
					if (pet.speedChangeTimer >= pet.speedChangeTime) {
						pet.speedChangeTimer = 0;
						pet.speedChangeTime = Math.random() * 1.5 + 0.5;
						pet.speed = Math.random() * 9 * (1 + pet.drive*0.1);
						// If pet is lazy,
						if (pet.drive <= 0.1) {
							let roll = Math.random();
							if (roll < 0.1) {
								pet.speed = 0;
							}
						}
					}
				}
				pet.sy = pet.sy + 98 * dt; // Gravity
				// Actually move pet
				pet.x = pet.x + pet.speed * dt; // Horizontal movement
				pet.y = Math.min(0, pet.y + pet.sy * dt); // Vertical movement

				// Check if hit ground
				if (pet.y == 0 && pet.sy >= 0) {
					pet.sy = 0;
				}

				// Check if past finish line
				if (!pet.finished && pet.x >= 100) {
					pet.finish(this.placeCounter);
					this.placeCounter += 1; // Increment place counter
					if (this.placeCounter >= this.maxPets) {
						// All pets finished
						this.allFinished = true;
						break;
					}
				}
			}
		}
		
		// Update clients
		this.updateTimer += dt;
		if (this.updateTimer >= this.updateInterval) {
			this.sync();
		}

		// End race.
		if (this.started && this.allFinished) {
			this.allFinishedTimer += dt;
			if (this.allFinishedTimer >= this.allFinishedTime) {
				this.end();
			}
		}
	}

	// Send pet race data to clients
	// id: specific player (null for all)
	sync(id) {
		// Format:
		// [started, Pet #1, Pet #2, ...]
		let data = [this.started];
		for (let pet in this.pets) {
			// Send [itemId, name, x, speed, y, y speed]
			data.push([this.pets[pet].itemId,this.pets[pet].name,this.pets[pet].x,this.pets[pet].speed,this.pets[pet].y,this.pets[pet].sy]);
		}
		if (id) {
			io.to(id).emit("petRaceData", data);
		} else {
			io.to(`area:${this.area}`).emit("petRaceData", data);
		}
		this.updateTimer = 0;
	}

	end() {
		// Find winner
		let winneri = 0;
		for (let peti in this.pets) {
			if (this.pets[peti].place == 0) {
				winneri = peti;
				break;
			}
		}

		// Notify players
		io.to(`area:${this.area}`).emit("notify", `The race has ended! ${this.pets[winneri].name} wins!`, 8);

		// Pay out bets
		// you should just recieve double what you wagered
		let winningBets = [];
		for (let betId in this.bets) {
			let beti = this.bets[betId].i;
			if (beti == winneri) {
				winningBets.push(betId);
			}
		}
		for (let betId of winningBets) {
			let bet = this.bets[betId];
			let winnings = bet.amount * 2;
			io.to(betId).emit("notify", `You won ${winnings} nuggets!`, 8);
			io.to(betId).emit("addNuggets", winnings);
		}
		
		io.to(`area:${this.area}`).emit("petRaceData", false);

		// Reset state
		this.started = false;
		this.placeCounter = 0;
		this.allFinished = false; // Have all pets finished?
		this.allFinishedTimer = 0;

		this.pets = [];
		this.playersJoined = [];
		this.bets = {};
	}

	// debug
	status() {
		console.log("Started: ", this.started);
		console.log("Pets: ", this.pets);
		console.log("Bets: ", this.bets);
	}
}

class PetRacer {
	constructor(itemId, name="", owner="") {
		this.itemId = itemId; // itemId of pet "item"
		this.name = name;
		this.owner = owner; // Owner socket id (or "server")

		// Horizontal movement
		this.speed = 0;
		this.x = 0; // 0-100
		this.speedChangeTimer = 0;
		this.speedChangeTime = 0;
		this.drive = Math.random(); // How motivated is it? (Affects speed)

		// Vertical movement
		this.y = 0; // Used for jumping
		this.sy = 0;
	}

	finish(place) {
		this.finished = true;
		this.speed = 0;
		this.place = place;
	}
}

module.exports = {PetRaceClass};