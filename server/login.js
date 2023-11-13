// Handles POST requests to log in
const {app} = require("../server.js");
const express = require("express");

// TODO: use bcrypt to salt and hash passwords before storage in database
//const bcrypt = require('bcrypt');

app.use(express.json());       // Parse JSON bodies

app.post('/login-endpoint', (req, res) => {
	const receivedUsername = req.body.username;
	const receivedPassword = req.body.password;
  
	// Hardcoded test account
	const testUsername = 'username';
	const testPassword = 'Test';
  
	// Compare received credentials with test account
	if (receivedUsername === testUsername && receivedPassword === testPassword) {
		res.json({ success: true, message: 'Login successful' });
	} else {
		res.status(401).json({ success: false, message: 'Invalid credentials' });
	}
});  