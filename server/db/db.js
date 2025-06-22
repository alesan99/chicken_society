let Database;
if (process.env.USE_DB === "true") {
	const { DB } = require("./database.js");
	Database = new DB();
} else {
	// Mock database class
	const { MockDatabase } = require("./mock.js");
	Database = new MockDatabase();
}

module.exports = { Database };