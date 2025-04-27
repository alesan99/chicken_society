// Recieves client information and relays it to every other client.
const {io, playerList} = require("../server.js");
const {TimedEvents} = require("./timedevents.js");
const {PetRaceClass} = require("./petrace.js");
const {hasBadWords} = require("./filter.js");

const PetRace = new PetRaceClass();

// Minigame data
var minigameList = {
	runner: {
		// Temporary syncing data; can be discarded after players leave minigame
		players: {},
		data: {},
		host: false,
		// Should be stored by the server
		highscores: [[99, "Pro Gamer"],[0,"---"],[0,"---"]]
	}
};

// Timed events
TimedEvents.loadTimedEvents();

// User Connected! Start listening for any messages.
function listenToClient(socket) {
	// Creates listeners for client messages
	// This function is only called ONCE per client connection, the listeners are just callback functions
	console.log("A user connected");

	// Link socket.io session to express session (to know if this socket client is logged in)
	// the session ID is used as a room
	const session = socket.request.session;

	// Recieve information about players; Send out info to everyone
	socket.on("profile", (profile, callback) => {
		// TODO: Restructure this
		playerList[socket.id] = {
			id: socket.id, // Socket ID; Different for each browser tab

			loggedIn: false,
			sessionId: session.id, // Session ID; Stored in a cookie, shared across browser tabs
			accountId: false, // Account ID; ID created for the account data after registration, also the database ID

			state: "world",
			minigame: false,
			area: "hub",

			profile: profile,
			name: profile.name,

			chicken: {
				x: 0,
				y: 0,
				sx: 0,
				sy: 0,
				statusEffects: [],
				static: false
			},

			pet: {
				name: "",
				x: 0,
				y: 0,
				dead: false
			},
			
			// TEMPORARY: This should use a more sophisticated system designed around the database once its finished
			coop: {
				theme: false,
				furniture: []
			},
		};

		socket.join(`area:${playerList[socket.id].area}`); // Listen for events in area

		// Send -this- client a list of all players
		socket.emit("playerList", cleanPlayerList(playerList));
		// Send everyone else just a new entry to their player list
		socket.broadcast.emit("addPlayer", socket.id, cleanPlayerData(playerList[socket.id]));

		// Send this player all the timed events
		sendTimedEvents(socket.id);

		console.log(`Player "${profile.name}" joined.`);

		// Confirm a successful connection to client
		callback({
			status: "ok"
		});
	});

	// Recieved chicken data (position, velocity); Send out to everyone
	socket.on("chicken", (x, y, sx, sy) => {
		let playerData = playerList[socket.id];
		if (playerData) {
			playerData.chicken.x = x;
			playerData.chicken.y = y;
			playerData.chicken.sx = sx;
			playerData.chicken.sy = sy;

			// Let every player in the area know this information (excluding sender)
			socket.to(`area:${playerData.area}`).emit("chicken", socket.id, x, y, sx, sy);
		}
	});

	socket.on("action", (actions) => {
		// Actions: an array of [string, array]
		let playerData = playerList[socket.id];
		if (playerData) {
			let actionsToSend = [];
			for (let i in actions) {
				// Handle individual actions
				let action = actions[i];
				let name = action[0];
				let args = action[1];
				switch(name) {
				// Player emoted
				case "emote":
					actionsToSend.push(action);
					break;
					// Player got a status effect
				case "statusEffect": {
					actionsToSend.push(action);
					// args = [name, timer]
					let effect = {
						name: args[0],
						timer: args[1]
					};
					playerData.chicken.statusEffects.push(effect);
					break;
				}
				case "shoot":
					actionsToSend.push(action);
					break;
				case "message": {
					let header = args[0];
					let contents = args[1];
					handleClientMessage(socket.id, header, contents);
					break;
				}
				case "jump":
					actionsToSend.push(action);
					break;
				}
			}
			socket.to(`area:${playerData.area}`).emit("action", socket.id, actionsToSend);
		}
	});

	// Recieve chat message and send out to everyone
	socket.on("chat", (text) => {
		let playerData = playerList[socket.id];
		if (playerData) {
			// Word filter
			if (hasBadWords(text)) {
				return false;
			}
			// Text looks good, send
			socket.broadcast.emit("chat", socket.id, text); // Use this to exlude the sender
		}
	});

	// Player changed their own profile, update
	socket.on("updateProfile", (profile) =>{
		let playerData = playerList[socket.id];
		if (playerData) {
			playerData.profile = profile;
			let name = profile.name;
			if (hasBadWords(name)) { // Word filter
				name = "Chicken";
				profile.name = name;
			}
			playerData.name = name;
			socket.broadcast.emit("updateProfile", socket.id, profile);
		}
	});

	// Player's pet information changed
	socket.on("updatePetProfile", (profile) =>{
		let playerData = playerList[socket.id];
		if (playerData) {
			playerData.pet = profile;
			socket.broadcast.emit("updatePetProfile", socket.id, profile);
		}
	});
	
	// Player moved area
	socket.on("area", (area, ownerId=false) =>{
		let playerData = playerList[socket.id];
		if (playerData) {
			// Send player into current area room
			let oldArea = playerData.area;
			let rawArea = area; // Area before server-specific modifications
			if (area == "coop") {
				// Make each player's coop a unique room
				area = `coop:${ownerId}`;
			}
			playerData.area = area;

			// Leave old area
			socket.leave(`area:${oldArea}`);
			// Join new area
			socket.join(`area:${area}`);

			socket.broadcast.emit("area", socket.id, area); // Let everyone know

			// Players in target area have not been updating -this- player about their position/state
			// Tell this player where everyone is at
			for (const [id, data] of Object.entries(playerList)) {
				if (id != socket.id && data.area == area) {
					// Send other player position
					io.to(socket.id).emit("chicken", id, data.chicken.x, data.chicken.y, data.chicken.sx, data.chicken.sy);
					// Send misc. other player state info.
					let actions = [];
					// status effects
					if (data.chicken.statusEffects.length > 0) {
						for (const effect of data.chicken.statusEffects) {
							actions.push(["statusEffect", [effect.name, effect.timer]]);
						}
					}
					io.to(socket.id).emit("action", id, actions);
				}
			}

			// TODO: Don't copy paste code
			// This player has not been updating others on their position/state
			let data = playerData;
			let id = socket.id;
			// Send other player position
			socket.broadcast.emit("chicken", id, data.chicken.x, data.chicken.y, data.chicken.sx, data.chicken.sy);
			// Send misc. other player state info.
			let actions = [];
			// status effects
			if (data.chicken.statusEffects.length > 0) {
				for (const effect of data.chicken.statusEffects) {
					actions.push(["statusEffect", [effect.name, effect.timer]]);
				}
			}
			socket.broadcast.emit("action", id, actions);
		}
	});

	// Player disconnected; Tell all players that someone disconnected
	socket.on("disconnect", () => {
		if (!playerList[socket.id]) {
			return false;
		}
		if (playerList[socket.id].minigame) {
			// Remove from minigame
			let minigameName = playerList[socket.id].minigame;
			let minigameData = minigameList[minigameName];
			if (minigameName && minigameData) {
				socket.leave(`minigame:${minigameName}`);
				socket.to(`minigame:${minigameName}`).emit("minigameRemovePlayer", socket.id);
				delete minigameData.players[socket.id];
			} else {
				console.log(`Error: Attempting to remove ${playerList[socket.id].name} from minigame, but cannot find minigame "${minigameName}"`);
			}
		}
		delete playerList[socket.id];
		io.emit("removePlayer", socket.id);
	});

	// Minigames
	// Player joined minigame
	socket.on("minigame", (minigameName, callback) => {
		let playerData = playerList[socket.id];

		if (!playerData) {
			return false;
		}

		if (minigameName) {
			// Joined minigame
			if (!minigameList[minigameName]) {
				minigameList[minigameName] = {
					players: {},
					data: {},
					upToDate: {},
					host: false,
					highscores: [[10, "Pro Gamer"],[0,"---"],[0,"---"]]
				};
			}
			let minigameData = minigameList[minigameName];

			playerList[socket.id].minigame = minigameName;

			minigameData.players[socket.id] = true; // connected
			minigameData.data[socket.id] = {}; // what is their minigame like?

			let role;
			if (Object.keys(minigameData.players).length > 1) {
				role = "player";
			} else {
				role = "host";
				minigameData.host = socket.id;
			}
			socket.join(`minigame:${minigameName}`);
			socket.emit("minigameRole", role, minigameData.players);
			socket.emit("minigameHighscores", minigameData.highscores);

			socket.to(`minigame:${minigameName}`).emit("minigameAddPlayer", socket.id);

			// Send it all the data that has happened so far
			for (const [id, data] of Object.entries(minigameData.data)) {
				if (id != socket.id) {
					io.to(socket.id).emit("minigame", id, data);
				}
			}
		} else {
			// Left minigame
			// Remove from minigame
			let minigameName = playerList[socket.id].minigame;
			let minigameData = minigameList[minigameName];
			if (minigameName && minigameData) {
				socket.leave(`minigame:${minigameName}`);
				socket.to(`minigame:${minigameName}`).emit("minigameRemovePlayer", socket.id);
				delete minigameData.players[socket.id];
			} else {
				console.log(`Error: Attempting to remove ${playerList[socket.id].name} from minigame, but cannot find minigame "${minigameName}"`);
			}
			playerList[socket.id].minigame = false;
		}
		callback({
			status: "ok"
		});
	});
	// Relay minigame data
	socket.on("minigameData", (minigameName, newData) => {
		// Recieving only CHANGED minigame data
		let playerData = playerList[socket.id];
		if (!playerData) {
			return false;
		}
		
		if (!minigameName) {
			console.log(`Error: ${playerData.name}'s minigame doesn't exist`);
			return false;
		}

		let minigameData = minigameList[minigameName];

		if (minigameData && minigameData.data) { // Check if minigame has been loaded by server
			// Find changes & store new data
			let data = minigameData.data[socket.id];
			for (const [key, value] of Object.entries(newData)) {
				if (data[key] != value) {
					data[key] = value;
				}
			}
			// Send -changed- data to players
			socket.to(`minigame:${minigameName}`).emit("minigame", socket.id, newData);
			// Look for new highscore?
			if (newData.score) {
				if ((!minigameData.highscores[0]) || (data.score > minigameData.highscores[2][0])) {
					console.log(`New Highscore in ${minigameName}!`, data.score, playerData.name);
					minigameData.highscores.push([data.score, playerData.name]);
					minigameData.highscores.sort((a, b) => b[0] - a[0]);
					minigameData.highscores = minigameData.highscores.slice(0, 3); // Limit to 3 highscores
					// Send new highscore list to everyone
					io.to(`minigame:${minigameName}`).emit("minigameHighscores", minigameData.highscores);
				}
			}
		}
	});

	// Coops
	// Receive coop layout updates
	socket.on("coopData", (data) => {
		let playerData = playerList[socket.id];
		if (playerData) {
			playerData.coop = data;
		}
	});
	// send coop data once requested
	socket.on("requestCoopData", (id, callback) => {
		let playerData = playerList[id];
		let data = false;
		if (playerData) {
			data = playerData.coop;
		} else {
			data = {
				theme: false,
				furniture: []
			};
		}
		// Confirm a successful connection to client
		callback(data);
	});
}

// All the playerData in playerList gets sent to clients.
// This function compiles only the necessary data to send to clients.
function cleanPlayerList(playerList) {
	let cleanedPlayerList = {};
	for (const [id, playerData] of Object.entries(playerList)) {
		cleanedPlayerList[id] = cleanPlayerData(playerData);
	}
	return cleanedPlayerList;
}

function cleanPlayerData(playerData) {
	return {
		id: playerData.id,

		state: playerData.state,
		minigame: playerData.minigame,
		area: playerData.area,

		profile: playerData.profile,
		name: playerData.name,
		pet: playerData.pet,

		chicken: playerData.chicken
	};
}

// Get current player data (from playerList) from session ID
// Remember: session ID is stored in a cookie in the player's browser. It won't be the same forever and it is shared between all tabs.
function getPlayerFromSession(sessionId) {
	for (const [id, player] of Object.entries(playerList)) {
		if (player.sessionId == sessionId) {
			return player;
		}
	}
	console.log(`No player with session ID ${sessionId}`);
	return false;
}

// // Log in player
// // Call to make a player "aware" they have been logged in. This means their data will periodically be saved to the database.
// function loginPlayer(player, db_Id) {
// 	if (player) {
// 		player.loggedIn = true;
// 		player.accountId = db_Id ; // TODO: Get account ID from database
// 		console.log(`Session belongs to ${player.name}.`);
// 	} else {
// 		console.log("Session does not belong to a player.");
// 		return false
// 	}
// }

// Continuously update game logic
// Used for:
// to predict player states
// server-wide events
let timedEventsCheckTime = 10*60; // Check for timed events every 10 minutes
let timedEventsTimer = timedEventsCheckTime;
function serverLoop(dt) {
	// Update player predictions
	for (const [id, playerData] of Object.entries(playerList)) {
		// Update status effect timer predictions
		let statusEffects = playerData.chicken.statusEffects;
		for (let i = statusEffects.length-1; i >= 0; i--) {
			let effect = statusEffects[i];
			effect.timer -= dt;
			if (effect.timer <= 0) {
				statusEffects.splice(i, 1);
			}
		}
	}

	// Update timed events every hour
	timedEventsTimer += dt;
	if (timedEventsTimer >= timedEventsCheckTime) {
		if (TimedEvents.update()) {
			// Timed events have changed
			sendTimedEvents();
		}
		timedEventsTimer -= timedEventsCheckTime;
	}

	// Pet race
	PetRace.update(dt);
}

function sendTimedEvents(id) {
	if (id) {
		// Send timed events to one player
		io.to(id).emit("timedEvents", TimedEvents.getActiveTimedEvents());
	} else {
		// Send timed events to all players
		io.emit("timedEvents", TimedEvents.getActiveTimedEvents());
	}
}

// Handle message from client; client wants to tell only the server something
function handleClientMessage(id, header, contents) {
	let playerData = playerList[id];
	if (header == "petRace") {
		//console.log(playerData.name, "wants to join pet race.");
		let pet = playerData.profile.pet;
		let petName = playerData.pet.name;
		PetRace.addPet(id, pet, petName);
	} else if (header == "petRace:bet") {
		//console.log(playerData.name, "wants to bet on a pet in the pet race.");
		let amount = contents[0];
		let petNo = contents[1];
		PetRace.placeBet(id, amount, petNo);
	}
	// PetRace.status(); // debug console print
}

module.exports = {
	listenToClient,
	serverLoop,
	getPlayerFromSession
};