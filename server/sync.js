// Recieves client information and relays it to every other client.
const {io, playerList} = require("../server.js");

var minigameData = {};

// User Connected! Start listening for any messages.
function listenToClient(socket) {
	// Creates listeners for client messages
	// This function is only called ONCE per client connection, the listeners are just callback functions
	console.log("A user connected");

	// Recieve information about players; Send out info to everyone
	socket.on("profile", (profile) => {
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
			for (const [id, connected] of Object.entries(minigameData[minigameName].players)) {
				if (id != socket.id) {
					io.to(id).emit("minigameRemovePlayer", socket.id);
				}
			}
		}
		delete playerList[socket.id];
		io.emit("removePlayer", socket.id); // Use this to exlude the sender
	});

	// Minigames
	// Player joined minigame
	socket.on("minigame", (minigameName) => {
		if (!playerList[socket.id]) {
			return false
		}

		if (minigameName) {
			// Joined minigame
			if (!minigameData[minigameName]) {
				minigameData[minigameName] = {
					players: {},
					data: {},
					host: false
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

			for (const [id, connected] of Object.entries(minigameData[minigameName].players)) {
				if (id != socket.id) {
					io.to(id).emit("minigameAddPlayer", socket.id);
				}
			}
		} else {
			// Left minigame
			playerList[socket.id].minigame = false
			for (const [id, connected] of Object.entries(minigameData[minigameName].players)) {
				if (id != socket.id) {
					io.to(id).emit("minigameRemovePlayer", socket.id);
				}
			}
		}
	});
	// Relay minigame data
	socket.on("minigameData", (minigameName, data) => {
		if (!playerList[socket.id]) {
			return false
		}
		if (minigameData[minigameName].data) { // Check if minigame has been loaded by server
			minigameData[minigameName].data[socket.id] = data
			for (const [id, cpnnected] of Object.entries(minigameData[minigameName].players)) {
				if (id != socket.id) {
					io.to(id).emit("minigame", socket.id, data);
				}
			}
		}
	});
}

module.exports = {
	listenToClient
};