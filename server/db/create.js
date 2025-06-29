const tableQueries = [
	// profiles table is currently unused
	`CREATE TABLE IF NOT EXISTS profiles (
		profile_id INT AUTO_INCREMENT PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		color CHAR(7),
		head VARCHAR(255),
		face VARCHAR(255),
		body VARCHAR(255),
		item VARCHAR(255),
		pet VARCHAR(255)
	)`,

	`CREATE TABLE IF NOT EXISTS coops (
		coop_id INT AUTO_INCREMENT PRIMARY KEY,
		data TEXT
	)`,

	`CREATE TABLE IF NOT EXISTS savedata (
		savedata_id INT AUTO_INCREMENT PRIMARY KEY,
		profile_id INT,
		coop_id INT,
		data TEXT,
		FOREIGN KEY (profile_id) REFERENCES profiles(profile_id),
		FOREIGN KEY (coop_id) REFERENCES coops(coop_id)
	)`,

	`CREATE TABLE IF NOT EXISTS accounts (
		account_id INT AUTO_INCREMENT PRIMARY KEY,
		username VARCHAR(255) NOT NULL,
		password VARCHAR(255) NOT NULL,
		email VARCHAR(255),
		admin BOOL NOT NULL DEFAULT 0,
		savedata_id INT,
		FOREIGN KEY (savedata_id) REFERENCES savedata(savedata_id)
	)`
];

function createDatabase(connection, dbName) {
	return new Promise((resolve, reject) => {
		connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``, (err) => {
			if (err) {
				console.error("Error creating database:", err);
				return reject(err);
			}
			console.log(`Database "${dbName}" created or already exists.`);
			// Switch to the new database
			connection.changeUser({ database: dbName }, (err) => {
				if (err) {
					console.error("Error selecting database:", err);
					return reject(err);
				}

				// Run each table creation query in sequence
				Promise.all(tableQueries.map(q =>
					new Promise((res, rej) => connection.query(q, err => err ? rej(err) : res()))
				))
					.then(() => resolve())
					.catch(reject);
			});
		});
	});
}

module.exports = { createDatabase };