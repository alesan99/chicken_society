// Handles POST requests to log in
const { app } = require("../server.js");
const { getPlayerFromSession, loginPlayer } = require("./sync.js");
const express = require("express");
const { Database } = require("./db/db.js");
app.use(express.json()); // Parse JSON bodies

// Log in
app.post("/login", (req, res) => {
	const session = req.session;
	const sessionId = session.id;

	console.log(`Login request from session ID ${session.id} using username ${req.body.username}.`);
	const player = getPlayerFromSession(sessionId);
	if (!player) {
		console.warn(`Warning: Login request for ${req.body.username} does not belong to a connected player.`);
		return false;
	}

	const username = req.body.username;
	const password = req.body.password;
	const remember = req.body.remember;

	Database.loginUser(session, username, password).then(({accountId, admin}) => {
		// Officially log in the player
		req.session.regenerate((err) => {
			player.sessionId = session.id;
			req.session.accountId = accountId;
			req.session.username = username;
			if (remember) {
				// Remember logins for 31 days
				req.session.cookie.maxAge = 31*24*60*60*1000;
			} else {
				req.session.cookie.expires = false;
			}
			
			if (player && loginPlayer(player.id, accountId, username, admin)) {
				console.log(`User ${username} logged in successfully.`);
				res.json({ success: true, message: "Login successful" });
				return true;
			}

			console.log(`User ${username} logged in successfully, but not connected to game.`);
			res.json({ success: true, message: "Login successful" });
		});
	}).catch((err) => {
		console.warn(`Warning: Login failed for user ${username}. (${err})`);
		res.json({ success: false, message: "Invalid username or password" });
	});
});

// Register
app.post("/register", (req, res) => {
	const session = req.session;
	const sessionId = session.id;

	console.log(`Registration request from session ID ${session.id} using username ${req.body.username}`);
	const player = getPlayerFromSession(sessionId);
	if (!player) {
		console.warn(`Warning: Registration request for ${req.body.username} does not belong to a connected player.`);
		return false;
	}

	const username = req.body.username;
	const password = req.body.password;
	const email = req.body.email;

	Database.createUser(session, username, password, email).then((accountId) => {
		// Officially log in the player
		req.session.regenerate((err) => {
			player.sessionId = session.id;
			req.session.accountId = accountId;
			req.session.username = username;

			if (player && loginPlayer(player.id, accountId, username, false)) {
				console.log(`User ${username} registered and logged in successfully.`);
				res.json({ success: true, message: "Login successful" });
				return true;
			}

			console.log(`User ${username} registered successfully.`);
			res.json({ success: true, message: "Registration successful" });
		});
	}).catch((err) => {
		console.warn(`Warning: Registration failed for user ${username}. (${err})`);
		res.json({ success: false, message: "Cannot register. Try a different username." });
	});
});

// Log out
app.post("/logout", (req, res) => {
	const username = req.session.username;
	req.session.destroy(() => {
		console.log(`User ${username} successfully logged out.`);
		res.json({ success: true });
	});
});

// Current login status (if user chose to stay logged in)
app.get("/session", (req, res) => {
	if (req.session && req.session.accountId) {
		res.json({ loggedIn: true, username: req.session.username });
	} else {
		res.json({ loggedIn: false });
	}
});