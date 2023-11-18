// Handles POST requests to log in
const {app} = require("../server.js");
const express = require("express");
const db = require("./db/create_db.js");

// TODO: use bcrypt to salt and hash passwords before storage in database
const bcrypt = require('bcrypt');
const saltRounds = 20;


app.use(express.json());       // Parse JSON bodies

app.post('/login-endpoint', (req, res) => {
	const receivedUsername = req.body.username;
	const receivedPassword = req.body.password;
  
	// Hardcoded test account
	const testUsername = 'username';
	const testPassword = 'Test';
  
	// Compare received credentials with test account
	// if (receivedUsername === testUsername && receivedPassword === testPassword) {
	// 	res.json({ success: true, message: 'Login successful' });
	// } else {
	// 	res.status(401).json({ success: false, message: 'Invalid credentials' });
	// }
	if (receivedUsername && receivedPassword) {
		// Retrieve hashed password from the database based on the provided username
		const selectQuery = 'SELECT password FROM user WHERE username = ?';
		db.query(selectQuery, [receivedUsername], (selectErr, selectResults) => {
		  if (selectErr) {
			console.error('Error querying the database:', selectErr);
			res.status(500).json({ success: false, message: 'Internal Server Error' });
		  } else {
			if (selectResults.length > 0) {
			  const hashedPassword = selectResults[0].password;
	
			  // Compare the provided password with the hashed password
			  bcrypt.compare(receivedPassword, hashedPassword, (compareErr, match) => {
				if (compareErr) {
				  console.error('Error comparing passwords:', compareErr);
				  res.status(500).json({ success: false, message: 'Internal Server Error' });
				} else {
				  if (match) {
					console.log('Login successful');
					res.json({ success: true, message: 'Login successful' });
				  } else {
					console.log('Incorrect password');
					res.json({ success: false, message: 'Incorrect password' });
				  }
				}
			  });
			} else {
			  console.log('User not found');
			  res.json({ success: false, message: 'User not found' });
			}
		  }
		});
	  } else {
		res.status(400).json({ success: false, message: 'Invalid data in the request' });
	  }
});  
app.post('/register', (req, res) => {
	const username = req.body.registerUsername;
	const password = req.body.registerPassword;
	const email = req.body.registerEmail;
	bcrypt.hash(password, saltRounds, (hashErr, hashedPassword) => {
		if (hashErr) {
			console.error('Error hashing the password:', hashErr);
			res.status(500).json({ success: false, message: 'Internal Server Error' });
		  }else{
		// Check if the username already exists
		const checkQuery = 'SELECT * FROM user WHERE username = ?';
		db.query(checkQuery, [username], (checkErr, checkResults) => {
		if (checkErr) {
			console.error('Error checking username:', checkErr);
			res.status(500).json({ success: false, message: 'Internal Server Error' });
		} else {
			if (checkResults.length > 0) {
			res.json({ success: false, message: 'Username already exists' });
			} else {
			// Insert the new user into the database
			const insertQuery = 'INSERT INTO user (username, password, email) VALUES (?, ?, ?)';
			db.query(insertQuery, [username, hashedPassword, email], (insertErr, insertResults) => {
				if (insertErr) {
				console.error('Error inserting into the database:', insertErr);
				res.status(500).json({ success: false, message: 'Internal Server Error' });
				} else {
				res.json({ success: true, message: 'Registration successful' });
				}
			});
			}
		}
		});
		};
	});
});