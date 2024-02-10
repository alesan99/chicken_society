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

	// Recieve information about players; Send out info to everyone
	socket.on("profile", (profile, callback) => {
		// TODO: Restructure this
		playerList[socket.id] = {
			id: socket.id,

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

		io.emit("playerList", playerList) // TODO: Send a cleaned up list with less player data
		console.log(profile);

		callback({
			status: "ok"
		});
	});

	// Recieved chicken data (position, velocity); Send out to everyone
	socket.on("chicken", (position, velocity) => {
		if (playerList[socket.id]) {
			playerList[socket.id].chicken.x = position[0];
			playerList[socket.id].chicken.y = position[1];
			playerList[socket.id].chicken.sx = position[2];
			playerList[socket.id].chicken.sy = position[3];

			socket.broadcast.emit("chicken", socket.id, position); // Use this to exlude the sender
		};
	});

	socket.on("chickenAction", (position, velocity) => {
		if (playerList[socket.id]) {
			playerList[socket.id].chicken.x = position[0];
			playerList[socket.id].chicken.y = position[1];
			playerList[socket.id].chicken.sx = position[2];
			playerList[socket.id].chicken.sy = position[3];

			socket.broadcast.emit("chicken", socket.id, position); // Use this to exlude the sender
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
		if (playerList[socket.id]) {
			socket.broadcast.emit("updateProfile", socket.id, profile);
			playerList[socket.id].profile = profile;
		}
	});
	
	// Player emoted
	socket.on("emote", (emote) =>{
		if (playerList[socket.id]) {
			socket.broadcast.emit("emote", socket.id, emote);
		}
	});
	
	// Player moved area
	socket.on("area", (area) =>{
		if (playerList[socket.id]) {
			playerList[socket.id].area = area;
			socket.broadcast.emit("area", socket.id, area);
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
		io.emit("removePlayer", socket.id); // Use this to exlude the sender
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

module.exports = {
	listenToClient
};