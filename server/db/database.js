const mysql = require("mysql2");

const { createDatabase } = require("./create.js");
const bcrypt = require("bcrypt");
const saltRounds = 5;

class DB {
	initialize() {
	}

	load() {
		this.connection = null;
		this.pool = null; // TODO: Allows for multiple connections

		this.createDatabase().then(() => {
			this.connect();
		}).catch((err) => {
			console.error("Error creating database:", err);
		});
	}

	createDatabase() {
		const connection = mysql.createConnection({
			host: process.env.MYSQL_HOST,
			port: process.env.MYSQL_PORT,
			user: process.env.MYSQL_USER,
			password: process.env.MYSQL_PASSWORD,
		});

		const dbName = process.env.MYSQL_DATABASE;
		return createDatabase(connection, dbName).then(() => {
			connection.end();
		});
	}

	connect() {
		this.connection = mysql.createConnection({
			host: process.env.MYSQL_HOST,
			port: process.env.MYSQL_PORT,
			user: process.env.MYSQL_USER,
			password: process.env.MYSQL_PASSWORD,
			database: process.env.MYSQL_DATABASE,
		});

		this.connection.connect((err) => {
			if (err) {
				console.error("Error connecting to the database:", err);
				return;
			}
			console.log("Connected to the database.");
		});
	}

	createUser(session, username, password, email) {
		const sessionId = session.id;
		console.log(`Register request from session ID ${session.id}`);

		const hashedPassword = bcrypt.hashSync(password, saltRounds);
		const insertQuery = `
			INSERT INTO accounts (username, password, email)
			VALUES (?, ?, ?)
		`;

		return new Promise((resolve, reject) => {
			this.connection.query(insertQuery, [username, hashedPassword, email], (insertErr, insertResults) => {
				if (insertErr) {
					console.error("Error inserting user:", insertErr);
					reject(insertErr);
					return;
				}
				if (insertResults.affectedRows > 0) {
					console.log("User created successfully");
					const accountId = insertResults.insertId;
					resolve({success: true, accountId});
				} else {
					console.log("User creation failed");
					reject(new Error("User creation failed"));
				}
			});
		});
	}

	loginUser(session, username, receivedPassword) {
		const sessionId = session.id;
		console.log(`Login request from session ID ${session.id}`);

		const selectQuery = "SELECT password, account_id FROM accounts WHERE username = ?";
		return new Promise((resolve, reject) => {
			this.connection.query(selectQuery, [username], (selectErr, selectResults) => {
				if (selectErr) return reject(selectErr);
				if (selectResults.length > 0) {
					const hashedPassword = selectResults[0].password;
					const accountId = selectResults[0].account_id;
					console.log(`Found user ${username} with account ID ${accountId}`);
					bcrypt.compare(receivedPassword, hashedPassword, (compareErr, match) => {
						if (compareErr) {
							console.error("Error comparing passwords:", compareErr);
							reject(compareErr);
							return;
						}
						if (match) {
							console.log("Login successful");
							resolve({success: true, accountId});
						} else {
							console.log("Incorrect password");
							reject(new Error("Incorrect password"));
						}
					});
				}
			});
		});
	}

	getSavedata(accountId) {
		const sql = `
			SELECT s.data
			FROM accounts a
			JOIN savedata s ON a.savedata_id = s.savedata_id
			WHERE a.account_id = ?
			LIMIT 1
		`;

		return new Promise((resolve, reject) => {
			this.connection.query(sql, [accountId], (err, results) => {
				if (err) return reject(err);
				if (results.length === 0) return resolve(null);
				try {
					const data = JSON.parse(results[0].data);
					resolve(data);
				} catch (e) {
					reject(e);
				}
			});
		});
	}

	updateSavedata(accountId, data) {
		console.log(`Updating savedata for account ID ${accountId}`);
		return new Promise((resolve, reject) => {
			// Step 1: Get the account's savedata_id
			const getAccountSql = `
				SELECT username, savedata_id
				FROM accounts
				WHERE account_id = ?
				LIMIT 1
			`;
			this.connection.query(getAccountSql, [accountId], (err, results) => {
				if (err) return reject(err);
				if (results.length === 0) return reject(new Error("Account not found"));

				const savedataId = results[0].savedata_id;

				if (!savedataId) {
					// Step 2: No savedata, create it
					const defaultData = JSON.stringify(data);
					this.connection.query(
						"INSERT INTO savedata (data) VALUES (?)",
						[defaultData],
						(insertErr, insertResult) => {
							if (insertErr) return reject(insertErr);

							const newSavedataId = insertResult.insertId;
							// Step 3: Update account with new savedata_id
							this.connection.query(
								"UPDATE accounts SET savedata_id = ? WHERE account_id = ?",
								[newSavedataId, accountId],
								(updateErr) => {
									if (updateErr) return reject(updateErr);
									resolve(JSON.parse(defaultData));
								}
							);
						}
					);
				} else {
					// Step 4: Update existing savedata
					const updateSql = `
						UPDATE savedata
						SET data = ?
						WHERE savedata_id = ?
					`;
					this.connection.query(updateSql, [JSON.stringify(data), savedataId], (updateErr, updateResult) => {
						if (updateErr) return reject(updateErr);
						resolve(data);
					});
				}
			});
		});
		// const sql = `
		// 	UPDATE savedata s
		// 	JOIN accounts a ON a.savedata_id = s.savedata_id
		// 	SET s.data = ?
		// 	WHERE a.username = ?
		// `;
		// return new Promise((resolve, reject) => {
		// 	this.connection.query(sql, [data, username], (err, result) => {
		// 		if (err) return reject(err);
		// 		resolve(result.affectedRows > 0);
		// 	});
		// });
	}
}

module.exports = { DB };