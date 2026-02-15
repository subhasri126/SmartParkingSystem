const mysql = require("mysql2");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Subhasri@2006",
  database: "voyago_db",
  waitForConnections: true,
  connectionLimit: 10
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:", err.message);
  } else {
    console.log("MySQL Connected Successfully");
    connection.release();
  }
});

module.exports = pool.promise();
