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

    socket.on("profile", (profile) => {
        playerList[socket.id] = {};
        playerList[socket.id].id = socket.id;
        playerList[socket.id].x = 0;
        playerList[socket.id].y = 0;
        playerList[socket.id].profile = profile;

        io.emit("playerList", playerList) // TODO: Send a cleaned up list with less player data
        // io.emit("addPlayer", socket.id, playerList[socket.id]); // Use this to exlude the sender
        console.log(profile);
    });

    socket.on("player", (position) => {
        //console.log("message: " + msg);
        //io.emit("chat message", msg); // Broadcast the message to all connected clients.
        if (playerList[socket.id]) {
            playerList[socket.id].x = position[0];
            playerList[socket.id].y = position[1];

            console.log("Got position", socket.id)
            socket.broadcast.emit("player", socket.id, position); // Use this to exlude the sender
        };
    });

    socket.on("disconnect", () => {
        delete playerList[socket.id];
        io.emit("removePlayer", socket.id); // Use this to exlude the sender
    });
});

// Start server on port TODO: How to deploy??
server.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});

/*
const localIPAddress = "YOUR_LOCAL_IP_ADDRESS"; // Replace with your local IP address
const port = 3000; // Or any other port you prefer

server.listen(port, localIPAddress, () => {
    console.log(`Server is running on http://${localIPAddress}:${port}`);
}); */