// Handles POST requests to log in
const { app } = require("../server.js");
const { getPlayerFromSession, loginPlayer } = require("./sync.js");
const express = require("express");
const { Database } = require("./db/db.js");
app.use(express.json()); // Parse JSON bodies

app.post("/login-endpoint", (req, res) => {
	const session = req.session;
	const sessionId = session.id;

	console.log(`Login request from session ID ${session.id} using username ${req.body.username}.`);
	const player = getPlayerFromSession(sessionId);
	if (!player) {
		console.warn(`Warning: Login request for ${req.body.username} does not belong to a connect player.`);
		return false;
	}

	const receivedUsername = req.body.username;
	const receivedPassword = req.body.password;

	Database.loginUser(session, receivedUsername, receivedPassword).then((accountId) => {
		// Officially log in the player
		loginPlayer(player, accountId);

		console.log(`User ${receivedUsername} logged in successfully.`);
		res.json({ success: true, message: "Login successful" });
	}).catch((err) => {
		console.warning(`Warning: Login failed for user ${receivedUsername}. (${err})`);
		res.json({ success: false, message: "Invalid username or password" });
	});
});

app.post("/register", (req, res) => {
	const session = req.session;
	const sessionId = session.id;

	console.log(`Registration request from session ID ${session.id} using username ${req.body.registerUsername}`);
	const player = getPlayerFromSession(sessionId);
	if (player) {
		console.warn(`Warning: Registration request for ${req.body.username} does not belong to a connect player.`);
		return false;
	}

	const username = req.body.registerUsername;
	const password = req.body.registerPassword;
	const email = req.body.registerEmail;

	Database.createUser(session, username, password, email).then((accountId) => {
		// Officially log in the player
		loginPlayer(true, accountId);

		console.log(`User ${username} registered successfully.`);
		res.json({ success: true, message: "Registration successful" });
	}).catch((err) => {
		console.warn(`Warning: Registration failed for user ${username}. (${err})`);
		res.json({ success: false, message: "Cannot register. Try a different username." });
	});
});
