require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Gunakan environment variable agar fleksibel
const PORT = process.env.PORT || 5001;
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
};

// Fungsi inisialisasi tabel Users (Jalan otomatis saat server nyala)
const initDb = async () => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        await conn.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Tabel Users Siap (Auth Service)");
        conn.end();
    } catch (error) {
        console.error("❌ Gagal connect DB di Auth Service:", error.message);
    }
};

// Panggil fungsi initDb
initDb();

// --- ROUTE REGISTER ---
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email & Password wajib diisi" });

    try {
        const conn = await mysql.createConnection(dbConfig);
        
        // Cek apakah email sudah ada
        const [existing] = await conn.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            conn.end();
            return res.status(400).json({ error: "Email sudah terdaftar" });
        }

        // Hash password (enkripsi)
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Simpan ke DB
        await conn.execute('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword]);
        conn.end();
        
        res.status(201).json({ message: 'Registrasi Berhasil! Silakan Login.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ROUTE LOGIN ---
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const conn = await mysql.createConnection(dbConfig);
        
        // Cari user berdasarkan email
        const [users] = await conn.execute('SELECT * FROM users WHERE email = ?', [email]);
        conn.end();

        if (users.length === 0) return res.status(400).json({ error: "User tidak ditemukan" });

        const user = users[0];

        // Cek Password
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ error: "Password salah" });

        // Buat Token JWT (KTP Digital)
        const token = jwt.sign(
            { id: user.id, email: user.email }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );
        
        res.json({ 
            message: "Login Berhasil",
            token, 
            user: { id: user.id, email: user.email } 
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`🔐 Auth Service running on port ${PORT}`));