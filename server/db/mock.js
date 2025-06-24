class MockDatabase {
	initialize() {
		console.log("Database not initialized. Using mock database.");
	}
	load() {

	}
	createUser(session, username, password, email) {
		console.log(`Mock create user: ${username}`);
		return true;
	}
	loginUser(session, username, receivedPassword) {
		console.log(`Mock login user: ${username}`);
		return true;
	}
}

module.exports = { MockDatabase };