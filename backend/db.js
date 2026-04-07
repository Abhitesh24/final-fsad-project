const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper function to initialize DB
async function initDb() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
  });
  
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.MYSQL_DATABASE}\`;`);
  await connection.end();
  
  const fs = require('fs');
  const path = require('path');
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    const statements = schemaSql.split(';').filter(stmt => stmt.trim() !== '');
    for (let stmt of statements) {
      await pool.query(stmt);
    }
    console.log("Database initialized successfully.");
  } catch (err) {
    console.error("Error running schema.sql:", err);
  }
}

initDb();

module.exports = pool;
