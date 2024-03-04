const {io, playerList} = require("../../server.js");


function loginPlayer(player, db_Id) {
	if (player) {
		player.loggedIn = true;
		player.accountId = db_Id ; // TODO: Get account ID from database
		console.log(`Session belongs to ${player.name}.`);
		loginQueries(player);
	} else {
		console.log("Session does not belong to a player.");
		return false
	}
}
function loginQueries(player) {
	const con = require("../db/create_db.js").initializeDB(true);
	const selectQuery = 'SELECT * FROM Player WHERE player_id = ?';
	con.query(selectQuery, [player.accountId], (selectErr, selectResults) => {
		if (selectErr) {
			console.error('Error querying the database:', selectErr);
		} else {
			if (selectResults.length > 0) {
				console.log("Player data found");
				// player.invId = selectResults[0].inv_id;
				// player.questId = selectResults[0].quest_id;
				// player.minigameId = selectResults[0].minigame_id;
				// player.gprofileId = selectResults[0].gprofile_id;
			} else {
				console.log("Player data not found");
			}
		}
	});
	con.end();
}
module.exports = {
    loginPlayer
};