const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const db = pool.promise();

db.initDb = async () => {
    try {
        console.log("⏳ Sedang menyiapkan Database...");

        await db.query(`
            CREATE TABLE IF NOT EXISTS monitors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                url VARCHAR(255) NOT NULL,
                interval_min INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                monitor_id INT,
                status VARCHAR(50),
                response_time INT,
                checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
            )
        `);

        console.log("✅ Database Tables Ready! (Tabel Siap)");
    } catch (error) {
        console.error("❌ Gagal membuat tabel. Pastikan Database MySQL sudah Running.");
        console.error(error);
        process.exit(1); 
    }
};

module.exports = db;