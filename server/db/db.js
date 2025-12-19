let Database;
console.log("USE_DB environment variable:", process.env.USE_DB);
if (process.env.USE_DB === "true") {
	const { DB } = require("./database.js");
	Database = new DB();
} else {
	// Mock database class
	const { MockDatabase } = require("./mock.js");
	Database = new MockDatabase();
	console.log("Using MockDatabase (USE_DB is not set to 'true')");
}

module.exports = { Database };