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
const io = new Server(server);
const db = require("./server/db/create_db.js");
var playerList = {};
module.exports = {
	io, playerList, app
};

// Send HTML file when user connects to server
const path = require("path"); // Import the "path" module.
app.use(express.static(path.join(__dirname, "website"))); //serve static files from the "website" directory.
app.get("/", (req, res) => {
	res.sendFile(__dirname + "/website/index.html");
});

// Handle logins
require("./server/login.js")

// Set up client syncing
const {listenToClient} = require("./server/sync.js");

io.on("connection", (socket) => {listenToClient(socket)});

// Handle GET Requests
const {} = require("./server/requests.js");

// Start server on port TODO: How to deploy??
const localIPAddress = "localhost" // ipv4 //"10.104.58.91" // IPv4 or localhost
const port = 3000
db.initializeDB;
db.query("SHOW TABLES like 'user'", (err, result, fields) => {
	// if (err) throw err;
	// console.log(result);
	if (result.length == 0) {
		console.log("No user found");
		const createTableQuery = `
        CREATE TABLE user (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(255) NOT NULL,
          color VARCHAR(255) NOT NULL,
		  red TINYINT UNSIGNED NOT NULL,
		  blue TINYINT UNSIGNED NOT NULL,
		  green TINYINT UNSIGNED NOT NULL,
		  hat VARCHAR(255) NOT NULL,
		  accessory VARCHAR(255) NOT NULL,
		  money INT UNSIGNED NOT NULL
        )`;
		db.query(createTableQuery, (createError) => {
			if (createError) {
			}
			console.log('User table created');
			});
			}
			else {
		  		console.log('User table already exists');
			}
	});
db.query("SELECT * FROM user");
server.listen(port, localIPAddress, () => {
	console.log(`Server is running on http://${localIPAddress}:${port}`)
})