// Recieves client information and relays it to every other client.
const {io, playerList} = require("../server.js");

// User Connected! Start listening for any messages.
function listenToClient(socket) {
	// Creates listeners for client messages
	// This function is only called ONCE per client connection, the listeners are just callback functions
	console.log("A user connected");

	// Recieve information about players; Send out info to everyone
	socket.on("profile", (profile) => {
		playerList[socket.id] = {};
		playerList[socket.id].id = socket.id;
		playerList[socket.id].x = 0;
		playerList[socket.id].y = 0;
		playerList[socket.id].profile = profile;

		io.emit("playerList", playerList) // TODO: Send a cleaned up list with less player data
		console.log(profile);
	});

	// Recieved player data (position, velocity); Send out to everyone
	socket.on("player", (position, velocity) => {
		if (playerList[socket.id]) {
			playerList[socket.id].x = position[0];
			playerList[socket.id].y = position[1];
			playerList[socket.id].sx = position[2];
			playerList[socket.id].sy = position[3];

			socket.broadcast.emit("player", socket.id, position); // Use this to exlude the sender
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
		socket.broadcast.emit("updateProfile", socket.id, profile);
		playerList[socket.id].profile = profile;
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
			socket.broadcast.emit("area", socket.id, area);
		}
	});

	// Player disconnected; Tell all players that someone disconnected
	socket.on("disconnect", () => {
		delete playerList[socket.id];
		io.emit("removePlayer", socket.id); // Use this to exlude the sender
	});
}

module.exports = {
	listenToClient
};