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

		const hashedPassword = bcrypt.hashSync(password, saltRounds);
		const insertUserSql = `
			INSERT INTO accounts (username, password, email)
			VALUES (?, ?, ?)
		`;
		const getUserSql = `
			SELECT * FROM accounts WHERE username = ?
		`;

		return new Promise((resolve, reject) => {
			// Check if user already exists
			this.connection.query(getUserSql, [username], (err, results) => {
				if (err) return reject(err);
				if (results.length > 0) {
					console.log(`Error: User with username ${username} already exists.`);
					reject("User already exists.");
					return;
				}

				this.connection.query(insertUserSql, [username, hashedPassword, email], (insertErr, insertResults) => {
					if (insertErr) {
						console.error("Error inserting user:", insertErr);
						reject(insertErr);
						return;
					}
					if (insertResults.affectedRows > 0) {
						console.log("User created successfully");
						const accountId = insertResults.insertId;
						resolve(accountId);
					} else {
						console.log("User creation failed");
						reject(new Error("User creation failed"));
					}
				});
			});
		});
	}

	loginUser(session, username, receivedPassword) {
		const sessionId = session.id;

		const getPasswordSql = "SELECT password, account_id, admin FROM accounts WHERE username = ?";
		
		return new Promise((resolve, reject) => {
			// Retrieve password hash belonging to user
			this.connection.query(getPasswordSql, [username], (err, selectResults) => {
				if (err) return reject(err);
				if (selectResults.length > 0) {
					const hashedPassword = selectResults[0].password;
					const accountId = selectResults[0].account_id;
					const admin = selectResults[0].admin;
					// Compare password hashes
					bcrypt.compare(receivedPassword, hashedPassword, (compareErr, match) => {
						if (compareErr) {
							reject(compareErr);
							return;
						}
						if (match) {
							resolve({accountId, admin});
						} else {
							reject(new Error("Incorrect password."));
						}
					});
				}
			});
		});
	}

	getAccount(accountId) {
		const getAccountSql = `
			SELECT username, admin
			FROM accounts
			WHERE account_id = ?
			LIMIT 1
		`;
		return new Promise((resolve, reject) => {
			this.connection.query(getAccountSql, [accountId], (err, results) => {
				if (err) return reject(err);
				if (results.length === 0) return reject(new Error(`No account found for account id ${accountId}.`));
				const username = results[0].username;
				const admin = results[0].admin;
				resolve({username, admin});
			});
		});
	}

	getSaveData(accountId) {
		const getSaveDataSql = `
			SELECT s.data
			FROM accounts a
			JOIN savedata s ON a.savedata_id = s.savedata_id
			WHERE a.account_id = ?
			LIMIT 1
		`;
		return new Promise((resolve, reject) => {
			this.connection.query(getSaveDataSql, [accountId], (err, results) => {
				if (err) return reject(err);
				if (results.length === 0) return reject(new Error(`No saveData found for account ${accountId}.`));
				try {
					const data = JSON.parse(results[0].data);
					resolve(data);
				} catch (e) {
					reject(e);
				}
			});
		});
	}

	updateSaveData(accountId, data) {
		const getAccountSql = `
			SELECT username, savedata_id
			FROM accounts
			WHERE account_id = ?
			LIMIT 1
		`;
		const updateSaveDataSql = `
			UPDATE savedata
			SET data = ?
			WHERE savedata_id = ?
		`;
		const createSaveDataSql = `
			INSERT INTO savedata (data) VALUES (?)
		`;
		const updateAccountSql = `
			UPDATE accounts SET savedata_id = ? WHERE account_id = ?
		`;

		const dataString = JSON.stringify(data);

		return new Promise((resolve, reject) => {
			// Step 1: Get the account's savedata_id
			this.connection.query(getAccountSql, [accountId], (err, results) => {
				if (err) return reject(err);
				if (results.length === 0) return reject(new Error("Account not found"));

				const savedataId = results[0].savedata_id;

				if (!savedataId) {
					// Step 2a: No savedata, create it
					this.connection.query(
						createSaveDataSql,
						[dataString],
						(insertErr, insertResult) => {
							if (insertErr) return reject(insertErr);

							const newSaveDataId = insertResult.insertId;
							// Step 3: Update account with new savedata_id
							this.connection.query(updateAccountSql, [newSaveDataId, accountId], (updateErr) => {
								if (updateErr) return reject(updateErr);
								resolve();
							});
						}
					);
				} else {
					// Step 2b: Update existing savedata
					this.connection.query(updateSaveDataSql, [dataString, savedataId], (updateErr) => {
						if (updateErr) return reject(updateErr);
						resolve();
					});
				}
			});
		});
	}

	getCoopData(accountId) {
		const getCoopSql = `
			SELECT c.data
			FROM accounts a
			JOIN savedata s ON a.savedata_id = s.savedata_id
			JOIN coops c ON s.coop_id = c.coop_id
			WHERE a.account_id = ?
			LIMIT 1
		`;
		return new Promise((resolve, reject) => {
			this.connection.query(getCoopSql, [accountId], (err, results) => {
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

	updateCoopData(accountId, data) {
		const getCoopIdSql = `
			SELECT s.coop_id, s.savedata_id
			FROM accounts a
			JOIN savedata s ON a.savedata_id = s.savedata_id
			WHERE a.account_id = ?
			LIMIT 1
		`;
		const updateCoopSql = `
			UPDATE coops
			SET data = ?
			WHERE coop_id = ?
		`;
		const insertCoopSql = `
			INSERT INTO coops (data) VALUES (?)
		`;
		const updateSavedataCoopIdSql = `
			UPDATE savedata SET coop_id = ? WHERE savedata_id = ?
		`;

		const dataString = JSON.stringify(data);

		return new Promise((resolve, reject) => {
			this.connection.query(getCoopIdSql, [accountId], (err, results) => {
				if (err) return reject(err);
				if (results.length === 0) return reject(new Error("Account or savedata not found"));

				const coopId = results[0].coop_id;
				const savedataId = results[0].savedata_id;

				if (coopId) {
					// Coop exists, update it
					this.connection.query(updateCoopSql, [dataString, coopId], (updateErr) => {
						if (updateErr) return reject(updateErr);
						resolve(data);
					});
				} else {
					// Coop does not exist, insert and update savedata.coop_id
					this.connection.query(insertCoopSql, [dataString], (insertErr, insertResult) => {
						if (insertErr) return reject(insertErr);
						const newCoopId = insertResult.insertId;
						this.connection.query(updateSavedataCoopIdSql, [newCoopId, savedataId], (updateErr) => {
							if (updateErr) return reject(updateErr);
							resolve(data);
						});
					});
				}
			});
		});
	}
}

module.exports = { DB };