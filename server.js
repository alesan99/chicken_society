/**
	Functionality:
	After connecting to user, serves them index.html and the game.
	Stores the user's information to a list
	Recieves all players profile information and their characters current position
	Sends out that information to all connnected clients so their games are all synced
	Activates global timed events (like holiday celebrations)
	Storing user data to database
 */

// Currently supports hosting the server locally and to current network

require("dotenv").config();
const express = require("express");
const expressSession = require("express-session");
const app = express();
const http = require("http"); // Used to start server
const server = http.createServer(app);
const { Worker } = require("worker_threads"); // Allow multi-threading
const rateLimit = require("express-rate-limit"); // Limit requests to server
const path = require("path"); // Used to build paths

// Session; used for logins and user data
const sessionData = {
	secret: process.env.SESSION_SECRET || Math.random().toString(36).substring(2),
	resave: true,
	saveUninitialized: true,
	accountId: null,
	username: null,
	cookie: {
		httpOnly: true,
		sameSite: "lax"
	}
	// TODO: use a session store for scalability
};
if (app.get("env") === "production") {
	app.set("trust proxy", 1);
	sessionData.cookie.secure = true;
}
const sessionMiddleware = expressSession(sessionData);
  
app.use(sessionMiddleware);

// Rate limiter; helps stop exessive requests to server
const limiter = rateLimit({
	windowMs: 10 * 60 * 1000, // 10 minutes
	max: 5000, // Limit each IP to 5000 requests per windowMs
	message: "Too many requests from this IP, please try again after 10 minutes"
});

app.use(limiter);

const { Server } = require("socket.io");
const msgpack = require("socket.io-msgpack-parser"); // Import the socket.io-msgpack-parser module. If this crashes run "npm ci" again.
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
// Handle GET Requests
const {handleQuery} = require("./server/requests.js");
app.get("/", (req, res) => {
	handleQuery(res.query);
	res.sendFile(path.join(__dirname, "website/index.html"));
});

// Handle logins
require("./server/login.js");

// Set up client syncing
io.engine.use(sessionMiddleware);
const {listenToClient, serverLoop} = require("./server/sync.js");

io.on("connection", (socket) => {listenToClient(socket);});

// User data database
const { Database } = require("./server/db/db.js");
Database.load();

// Start server on port
const localIPAddress = "localhost"; // ipv4 //"10.104.58.91" // IPv4 or localhost
const port = 3000;
server.listen(port, localIPAddress, () => {
	console.log(`Server is running on http://${localIPAddress}:${port}`);
});

// Start game loop
let lastUpdateTime = Date.now();
setInterval(() => {
	// get delta time
	const now = Date.now();
	const dt = (now - lastUpdateTime) / 1000; // Convert milliseconds to seconds
	lastUpdateTime = now;

	serverLoop(dt);
}, 1000 / 60);  // Run the loop 60 times per second