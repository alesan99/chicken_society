// Functionality:
// After connecting to user, serves them index.html and the game.
// Stores the user"s information to a list
// Recieves all players profile information and their characters current position
// Sends out that information to all connnected clients so their games are all synced
// NOT IMPLEMENTED: Storing user data to database, global events

// Currently supports hosting the server locally and to current network

// Note about storing player IDs: Please use a regular session ID (either sent in a cookie, or stored in the localStorage and sent in the auth payload).

const express = require("express");
const app = express();
const http = require("http"); // Used to start server
const server = http.createServer(app);

const { Server } = require("socket.io");
const msgpack = require("socket.io-msgpack-parser"); // Import the socket.io-msgpack-parser module. If this crashes run "npm ci" again
const io = new Server(server, {
	parser: msgpack // Use msgpack for faster serialization
});

var playerList = {};
module.exports = {
	io, playerList, app
};

// Send HTML file when user connects to server
const path = require("path"); // Import the "path" module.
app.use(express.static(path.join(__dirname, "lib"))); //serve msgpack socket.io separately so it doesn't get loaded when running website locally.
app.use(express.static(path.join(__dirname, "website"))); //serve static files from the "website" directory.
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "website/index.html"));
});

// Handle logins
require("./server/login.js")

// Set up client syncing
const {listenToClient} = require("./server/sync.js");

io.on("connection", (socket) => {listenToClient(socket)});

// Handle GET Requests
const {} = require("./server/requests.js");

// Start server on port
const localIPAddress = "localhost" // ipv4 //"10.104.58.91" // IPv4 or localhost
const port = 3000
server.listen(port, localIPAddress, () => {
	console.log(`Server is running on http://${localIPAddress}:${port}`)
})