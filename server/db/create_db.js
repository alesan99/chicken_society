const mysql = require("mysql2");

function initializeDB(strict = true){
  // params: strict - if true, throw an error if the connection fails
  const con = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "root",
    database: "chicken_society"
    });
    con.connect(function(err) {
        if (err) {
            console.log("Database connect failed")
            if (strict) {
              throw err;
            }
        }
        console.log("Connected!");
    });
    con.on('error', (err) => {
        console.error('MySQL database error:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
          // Reconnect if the connection is lost
          initializeDB();
        } else {
          if (strict) {
            throw err;
          }
        }
      });
    
      // Close the connection on process exit
      process.on('exit', () => {
        con.end();
        console.log('MySQL database connection closed on process exit');
      });
      return con;
};
function createPlayerTable(con, player_id) {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS Player (
        player_id INT PRIMARY KEY,
        inv_id INT,
        quest_id INT,
        minigame_id INT,
        gprofile_id INT,
        FOREIGN KEY (player_id) REFERENCES user(id),
        FOREIGN KEY (inv_id) REFERENCES inventory(inv_id),
        FOREIGN KEY (quest_id) REFERENCES quest(quest_id),
        FOREIGN KEY (minigame_id) REFERENCES minigame(minigame_id),
        FOREIGN KEY (gprofile_id) REFERENCES global(global_id)
    );
  `;

  // Use a parameterized query to set the player_id
  const insertPlayerIdQuery = `INSERT INTO Player (player_id) VALUES (${player_id})`;
  const updatePlayerQuery = `
  UPDATE Player
  SET inv_id = ?,
      quest_id = ?,
      minigame_id = ?,
      gprofile_id = ?
  WHERE player_id = ?;
`;

con.query(createTableQuery, (err, results) => {
  if (err) {
    console.error('Error creating or checking Player table:', err.message);
    // Handle the error, e.g., by closing the connection or returning an error response
  } else {
    console.log('Player table created or already exists');

    // Insert the specified player_id into the Player table
    con.query(insertPlayerIdQuery, [player_id], (insertErr, insertResults) => {
      if (insertErr) {
        console.error('Error inserting player_id:', insertErr.message);
        // Handle the error, e.g., by closing the connection or returning an error response
      } else {
        console.log(`Player_id ${player_id} inserted successfully`);

        // Retrieve the auto-generated inv_id after inserting into the Inventory table
        con.query('INSERT INTO inventory () VALUES()', (invErr, invResults) => {
          if (invErr) {
            console.error('Error inserting into Inventory table:', invErr.message);
            // Handle the error
          } else {
            const inv_id = invResults.insertId;
            console.log(`Inventory ID ${inv_id} inserted successfully`);

            // Retrieve the auto-generated quest_id after inserting into the Quest table
            con.query('INSERT INTO quest () VALUES ()', (questErr, questResults) => {
              if (questErr) {
                console.error('Error inserting into Quest table:', questErr.message);
                // Handle the error
              } else {
                const quest_id = questResults.insertId;
                console.log(`Quest ID ${quest_id} inserted successfully`);

                // Retrieve the auto-generated minigame_id after inserting into the Minigame table
                con.query('INSERT INTO minigame () VALUES ()', (minigameErr, minigameResults) => {
                  if (minigameErr) {
                    console.error('Error inserting into Minigame table:', minigameErr.message);
                    // Handle the error
                  } else {
                    const minigame_id = minigameResults.insertId;
                    console.log(`Minigame ID ${minigame_id} inserted successfully`);

                    // Insert into the Global Profile table
                    con.query('INSERT INTO global () VALUES ()', (gprofileErr, gprofileResults) => {
                      if (gprofileErr) {
                        console.error('Error inserting into Global Profile table:', gprofileErr.message);
                        // Handle the error
                      } else {
                        const gprofile_id = gprofileResults.insertId;
                        console.log(`Global Profile ID ${gprofile_id} inserted successfully`);

                        // Update the Player table with the retrieved IDs
                        con.query(updatePlayerQuery, [inv_id, quest_id, minigame_id, gprofile_id, player_id], (updateErr, updateResults) => {
                          if (updateErr) {
                            console.error('Error updating Player table:', updateErr.message);
                            // Handle the error
                          } else {
                            console.log('Data inserted into all tables');
                          }

                          // Close the connection after executing the queries
                          con.end();
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  }
});
}
module.exports = {
  initializeDB,
  createPlayerTable};    