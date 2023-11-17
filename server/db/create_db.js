const mysql = require("mysql");
function initializeDB(){
    const con = mysql.createConnection({
        host: "0.0.0.0",
        user: "root",
        password: "root",
        database: "chicken_society"
    });

    con.connect(function(err) {
        if (err) {
            console.log("Database connect failed")
            throw err;}
        console.log("Connected!");
    });
    con.on('error', (err) => {
        console.error('MySQL database error:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
          // Reconnect if the connection is lost
          initializeDB();
        } else {
          throw err;
        }
      });
    
      // Close the connection on process exit
      process.on('exit', () => {
        con.end();
        console.log('MySQL database connection closed on process exit');
      });
      return con;
};

module.exports = initializeDB();    