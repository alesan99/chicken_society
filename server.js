// Functionality:
// After connecting to user, serves them index.html and the game.
// Stores the user"s information to a list
// Recieves all players profile information and their characters current position
// Sends out that information to all connnected clients so their games are all synced
// NOT IMPLEMENTED: Storing user data to database, global events

// Currently supports hosting the server locally and to current network

// Note about storing player IDs: Please use a regular session ID (either sent in a cookie, or stored in the localStorage and sent in the auth payload).

const express = require("express");
const session = require("express-session");
const app = express();
const http = require("http"); // Used to start server
const server = http.createServer(app);
const { Worker } = require('worker_threads'); // Allow multi-threading
const rateLimit = require('express-rate-limit'); // Limit requests to server
const path = require("path"); // Used to build paths

// Session; used for user data
const sessionMiddleware = session({
	secret: Math.random().toString(36).substring(2), // TODO: Use a library for this
	resave: true,
	saveUninitialized: true,
	account: null,
});
  
app.use(sessionMiddleware);

// Rate limiter; helps stop exessive requests to server
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5000, // Limit each IP to 5000 requests per windowMs
    message: 'Too many requests from this IP, please try again after 10 minutes'
});

app.use(limiter);

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
const { buildGame } = require("./server/build.js");
buildGame();
app.use(express.static(path.join(__dirname, "server/lib"))); //serve msgpack socket.io separately so it doesn't get loaded when running website locally.
app.use(express.static(path.join(__dirname, "website"))); //serve static files from the "website" directory.
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "website/index.html"));
});

// Handle logins
require("./server/login.js")

// Set up client syncing
io.engine.use(sessionMiddleware);
const {listenToClient, serverLoop} = require("./server/sync.js");

io.on("connection", (socket) => {listenToClient(socket)});

// User data database
useDB = false;
if (useDB) {
	const db = require("./server/db/create_db.js");
	const con = db.initializeDB();
	con.query("SHOW TABLES like 'user'", (err, result, fields) => {
		// if (err) throw err;
		// console.log(result);
		if (result.length == 0) {
			console.log("No user found");
			const createTableQuery = `
			CREATE TABLE user (
			id INT AUTO_INCREMENT PRIMARY KEY,
			username VARCHAR(255) NOT NULL,
			password VARCHAR(255) NOT NULL,
			email VARCHAR(255) NOT NULL
			)`;
			con.query(createTableQuery, (createError) => {
				if (createError) {
				}
				console.log('User table created');
				});
				}
				else {
					console.log('User table already exists');
				}m
		});
	db.createPlayerTable(con);
}

// Handle GET Requests
const {} = require("./server/requests.js");
const { create } = require("domain");

// Start server on port
const localIPAddress = "localhost" // ipv4 //"10.104.58.91" // IPv4 or localhost
const port = 3000
server.listen(port, localIPAddress, () => {
	console.log(`Server is running on http://${localIPAddress}:${port}`)
})

// Start game loop
let lastUpdateTime = Date.now();
setInterval(() => {
	// get delta time
	const now = Date.now();
	const dt = (now - lastUpdateTime) / 1000; // Convert milliseconds to seconds
	lastUpdateTime = now;

	serverLoop(dt);
}, 1000 / 60);  // Run the loop 60 times per second