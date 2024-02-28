// Recieves client information and relays it to every other client.
const {io, playerList} = require("../server.js");

// Minigame data
var minigameData = {
	runner: {
		// Temporary syncing data; can be discarded after players leave minigame
		players: {},
		data: {},
		host: false,
		// Should be stored by the server
		highscores: [[10, "Pro Gamer"],[0,"---"],[0,"---"]]
	}
};

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
				static: false
			},
		};

		socket.join(`area:${playerList[socket.id].area}`) // Listen for events in area

		io.emit("playerList", playerList) // TODO: Send a cleaned up list with less player data
		console.log(`Player "${profile.name}" joined.`);

		// Confirm a successful connection to client
		callback({
			status: "ok"
		});
	});

	// Recieved chicken data (position, velocity); Send out to everyone
	socket.on("chicken", (position, velocity) => {
		let playerData = playerList[socket.id];
		if (playerData) {
			playerData.chicken.x = position[0];
			playerData.chicken.y = position[1];
			playerData.chicken.sx = position[2];
			playerData.chicken.sy = position[3];

			// Let every player in the area know this information (excluding sender)
			socket.to(`area:${playerData.area}`).emit("chicken", socket.id, position);
		};
	});

	socket.on("chickenAction", (position, velocity) => {
		let playerData = playerList[socket.id];
		if (playerData) {
			playerData.chicken.x = position[0];
			playerData.chicken.y = position[1];
			playerData.chicken.sx = position[2];
			playerData.chicken.sy = position[3];

			// Let every player in the area know this information (excluding sender)
			socket.to(`area:${playerData.area}`).emit("chicken", socket.id, position);
		};
	});

	// Recieve chat message and send out to everyone
	socket.on("chat", (text) => {
		if (playerList[socket.id]) {
			// TODO: Word filter
			socket.broadcast.emit("chat", socket.id, text); // Use this to exlude the sender
		};
	});

	// Player changed their own profile, update
	socket.on("updateProfile", (profile) =>{
		let playerData = playerList[socket.id];
		if (playerData) {
			playerData.profile = profile;
			playerData.name = profile.name;
			socket.broadcast.emit("updateProfile", socket.id, profile);
		}
	});
	
	// Player emoted
	socket.on("emote", (emote) =>{
		let playerData = playerList[socket.id];
		if (playerData) {
			// Send emote to only those in the area
			socket.to(`area:${playerData.area}`).emit("emote", socket.id, emote);
		}
	});
	
	// Player moved area
	socket.on("area", (area) =>{
		let playerData = playerList[socket.id];
		if (playerData) {
			// Leave old area
			socket.leave(`area:${playerData.area}`)
			// Join new area
			socket.join(`area:${area}`)

			playerData.area = area;
			socket.broadcast.emit("area", socket.id, area); // Let everyone know

			// Players in target area have not been updating this player about their position/state
			// Tell the player where everyone is at
			for (const [id, data] of Object.entries(playerList)) {
				if (id != socket.id && data.area == area) {
					io.to(socket.id).emit("chicken", id, [data.chicken.x, data.chicken.y, data.chicken.sx, data.chicken.sy]);
				}
			}
		}
	});

	// Player disconnected; Tell all players that someone disconnected
	socket.on("disconnect", () => {
		if (!playerList[socket.id]) {
			return false
		}
		if (playerList[socket.id].minigame) {
			// Remove from minigame
			let minigameName = playerList[socket.id].minigame
			if (minigameName && minigameData[minigameName]) {
				delete minigameData[minigameName].players[socket.id]
				for (const [id, connected] of Object.entries(minigameData[minigameName].players)) {
					if (id != socket.id) {
						io.to(id).emit("minigameRemovePlayer", socket.id);
					}
				}
			} else {
				console.log(`Error: Attempting to remove ${playerList[socket.id].name} from minigame, but cannot find minigame "${minigameName}"`)
			}
		}
		delete playerList[socket.id];
		io.emit("removePlayer", socket.id);
	});

	// Minigames
	// Player joined minigame
	socket.on("minigame", (minigameName, callback) => {
		if (!playerList[socket.id]) {
			return false
		}

		if (minigameName) {
			// Joined minigame
			if (!minigameData[minigameName]) {
				minigameData[minigameName] = {
					players: {},
					data: {},
					lastUpdate: {},
					host: false,
					highscores: [[10, "Pro Gamer"],[0,"---"],[0,"---"]]
				};
			}

			playerList[socket.id].minigame = minigameName

			minigameData[minigameName].players[socket.id] = true; // connected
			minigameData[minigameName].data[socket.id] = {}; // what is their minigame like?

			let role = "host";
			if (Object.keys(minigameData[minigameName].players).length > 1) {
				role = "player";
			} else {
				minigameData[minigameName].host = socket.id
			}
			socket.emit("minigameRole", role, minigameData[minigameName].players);
			socket.emit("minigameHighscores", minigameData[minigameName].highscores);

			for (const [id, connected] of Object.entries(minigameData[minigameName].players)) {
				if (id != socket.id) {
					io.to(id).emit("minigameAddPlayer", socket.id);
				}
			}
		} else {
			// Left minigame
			// Remove from minigame
			let minigameName = playerList[socket.id].minigame
			if (minigameName && minigameData[minigameName]) {
				delete minigameData[minigameName].players[socket.id]
				for (const [id, connected] of Object.entries(minigameData[minigameName].players)) {
					if (id != socket.id) {
						io.to(id).emit("minigameRemovePlayer", socket.id);
					}
				}
			} else {
				console.log(`Error: Attempting to remove ${playerList[socket.id].name} from minigame, but cannot find minigame "${minigameName}"`)
			}
			playerList[socket.id].minigame = false
		}
		callback({
			status: "ok"
		});
	});
	// Relay minigame data
	socket.on("minigameData", (minigameName, newData) => {
		// Recieving only CHANGED minigame data
		if (!playerList[socket.id]) {
			return false
		}

		if (!minigameName) {
			console.log(`Error: ${playerList[socket.id].name}'s minigame doesn't exist`)
			return false
		}

		if (minigameData[minigameName] && minigameData[minigameName].data) { // Check if minigame has been loaded by server
			// Find changes & store new data
			let data = minigameData[minigameName].data[socket.id]
			for (const [key, value] of Object.entries(newData)) {
				if (data[key] != value) {
					data[key] = value
				}
			}
			for (const [id, connected] of Object.entries(minigameData[minigameName].players)) {
				if (id != socket.id) {
					// TODO: only send changed data
					// This is will involve checking if each client even has the old data
					io.to(id).emit("minigame", socket.id, data);
				}
			}
			// Look for new highscore?
			if (newData.score) {
				if ((!minigameData[minigameName].highscores[0]) || (data.score > minigameData[minigameName].highscores[2][0])) {
					console.log(`New Highscore in ${minigameName}!`, data.score, playerList[socket.id].name)
					minigameData[minigameName].highscores.push([data.score, playerList[socket.id].name])
					minigameData[minigameName].highscores.sort((a, b) => b[0] - a[0]);
					minigameData[minigameName].highscores = minigameData[minigameName].highscores.slice(0, 3); // Limit to 3 highscores
					// Send new highscore list to everyone
					for (const [id, connected] of Object.entries(minigameData[minigameName].players)) {
						io.to(id).emit("minigameHighscores", minigameData[minigameName].highscores);
					}
				}
			}
		}
	});
	// socket.on("minigameHighscore", (minigameName, highscore) => {
	// 	if (!playerList[socket.id]) {
	// 		return false
	// 	}

	// 	if (!minigameName) {
	// 		console.log(`Error: ${playerList[socket.id].name}'s minigame doesn't exist`)
	// 		return false
	// 	}

	// 	if (highscore > minigameData[minigameName].highscores[0]) {
	// 		minigameData[minigameName].highscores[0] = highscore
	// 		minigameData[minigameName].highscores.sort((a, b) => b - a);
	// 		for (const [id, connected] of Object.entries(minigameData[minigameName].players)) {
	// 			if (id != socket.id) {
	// 				io.to(id).emit("minigameHighscores", minigameData[minigameName].highscores);
	// 			}
	// 		}
	// 	}
	// });
}

// Get current player data (from playerList) from session ID
// Remember: session ID is stored in a cookie in the player's browser. It won't be the same forever and it is shared between all tabs.
function getPlayerFromSession(sessionId) {
	for (const [id, player] of Object.entries(playerList)) {
		if (player.sessionId == sessionId) {
			return player
		}
	}
	console.log(`No player with session ID ${sessionId}`)
	return false
}

// Log in player
// Call to make a player "aware" they have been logged in. This means their data will periodically be saved to the database.
function loginPlayer(player, db_Id) {
	if (player) {
		player.loggedIn = true;
		player.accountId = db_Id ; // TODO: Get account ID from database
		console.log(`Session belongs to ${player.name}.`);
	} else {
		console.log("Session does not belong to a player.");
		return false
	}
}

module.exports = {
	listenToClient,
	getPlayerFromSession,
	loginPlayer
};