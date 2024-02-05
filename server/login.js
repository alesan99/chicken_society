// Handles POST requests to log in
const {app} = require("../server.js");
const express = require("express");
const db = require("./db/create_db.js");
const con = db.initializeDB();
// TODO: use bcrypt to salt and hash passwords before storage in database
const bcrypt = require('bcrypt');
const saltRounds = 5;
app.use(express.json());       // Parse JSON bodies

app.post('/login-endpoint', (req, res) => {
	const receivedUsername = req.body.username;
	const receivedPassword = req.body.password;
	// UNCOMMENT THIS SECTION TO USE HARDCODED TEST ACCOUNT
	// Hardcoded test account 
	// const testUsername = 'username';
	// const testPassword = 'Test';
  
	// Compare received credentials with test account
	// if (receivedUsername === testUsername && receivedPassword === testPassword) {
	// 	res.json({ success: true, message: 'Login successful' });
	// } else {
	// 	res.status(401).json({ success: false, message: 'Invalid credentials' });
	// }
	if (receivedUsername && receivedPassword) {
		// Retrieve hashed password from the database based on the provided username
		const selectQuery = 'SELECT password FROM user WHERE username = ?';
		con.query(selectQuery, [receivedUsername], (selectErr, selectResults) => {
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
		} else {
		  // Check if the username already exists
		  const checkQuery = 'SELECT * FROM user WHERE username = ?';
		  con.query(checkQuery, [username], (checkErr, checkResults) => {
			if (checkErr) {
			  console.error('Error checking username:', checkErr);
			  res.status(500).json({ success: false, message: 'Internal Server Error' });
			} else {
			  if (checkResults.length > 0) {
				res.json({ success: false, message: 'Username already exists' });
			  } else {
				// Insert the new user into the database
				const insertUserQuery = 'INSERT INTO user (username, password, email) VALUES (?, ?, ?)';
				con.query(insertUserQuery, [username, hashedPassword, email], (insertErr, insertResults) => {
				  if (insertErr) {
					console.error('Error inserting into the database:', insertErr);
					res.status(500).json({ success: false, message: 'Internal Server Error' });
					
				  } else {
					res.json({ success: true, message: 'Registration successful' });
	  
					// Grab user ID from the database
					const grabIDQuery = 'SELECT id FROM user WHERE username = ?';
					con.query(grabIDQuery, [username], (grabErr, grabResults) => {
					  if (grabErr) {
						console.error('Error grabbing ID from the database:', grabErr);
						res.status(500).json({ success: false, message: 'Internal Server Error' });
						
					  } else {
						const player_id = grabResults[0].id;
	  
						// Create the Player table
						db.createPlayerTable(con,player_id);
						
					  }
					});
				  }
				});
			  }
			}
		  });
		}
	  });
	});	  
