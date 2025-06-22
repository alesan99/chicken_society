// Handles POST requests to log in
const { app } = require("../server.js");
const { getPlayerFromSession, loginPlayer } = require("./sync.js");
const express = require("express");
const { Database } = require("./db/db.js");
app.use(express.json()); // Parse JSON bodies

app.post("/login-endpoint", (req, res) => {
	const session = req.session;
	const sessionId = session.id;

	console.log(`Login request from session ID ${session.id}`);
	const player = getPlayerFromSession(sessionId);
	if (player) {
		console.log(`Session belongs to ${player.name}.`);
	} else {
		console.log("Session does not belong to a player.");
		return false;
	}

	const receivedUsername = req.body.username;
	const receivedPassword = req.body.password;

	Database.loginUser(session, receivedUsername, receivedPassword).then(({success, accountId}) => {
		if (success) {
			// Officially log in the player
			loginPlayer(player, accountId);

			console.log(`User ${receivedUsername} logged in successfully.`);
			res.json({ success: true, message: "Login successful" });
		} else {
			console.log(`Login failed for user ${receivedUsername}.`);
			res.json({ success: false, message: "Invalid username or password" });
		}
	});
});
app.post("/register", (req, res) => {
	const session = req.session;
	const sessionId = session.id;

	console.log(`Register request from session ID ${session.id}`);
	const player = getPlayerFromSession(sessionId);
	if (player) {
		console.log(`Session belongs to ${player.name}.`);
	} else {
		console.log("Session does not belong to a player.");
		return false;
	}

	const username = req.body.registerUsername;
	const password = req.body.registerPassword;
	const email = req.body.registerEmail;

	Database.createUser(session, username, password, email).then(({success, accountId}) => {
		if (success) {
			loginPlayer(true, accountId);

			console.log(`User ${username} registered successfully.`);
			res.json({ success: true, message: "Registration successful" });
		} else {
			console.log(`Registration failed for user ${username}.`);
			res.json({ success: false, message: "Username already exists" });
		}
	}).catch((error) => {
		console.error("Error during registration:", error);
		res.status(500).json({ success: false, message: "Internal server error" });
	});
});
