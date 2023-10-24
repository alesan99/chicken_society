// Functionality:
// After connecting to user, serves them index.html and the game.
// Stores the user"s information to a list
// Recieves all players profile information and their characters current position
// Sends out that information to all connnected clients so their games are all synced
// NOT IMPLEMENTED: Storing user data to database, chatting, global events

// Should be simple to convert to another framework, just make sure it supports socket.io protocol to work with the current client-side game code.
// Currently supports hosting the server locally and to current network

// Note about storing player IDs: Please use a regular session ID (either sent in a cookie, or stored in the localStorage and sent in the auth payload).

const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);

// Send HTML file when user connects to server
const path = require("path"); // Import the "path" module.
app.use(express.static(path.join(__dirname, "website"))); //serve static files from the "website" directory.
app.get("/", (req, res) => {
	res.sendFile(__dirname + "/website/index.html");
});

// User Connected! Start listening for any messages.
var playerList = {};
io.on("connection", (socket) => {
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
});

// Start server on port TODO: How to deploy??
const localIPAddress = "localhost" // ipv4 //"10.104.58.91" // IPv4 or localhost
const port = 3000
server.listen(port, localIPAddress, () => {
	console.log(`Server is running on http://${localIPAddress}:${port}`)
})