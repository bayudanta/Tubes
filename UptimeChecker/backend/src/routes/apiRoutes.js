const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth'); // Panggil satpam tadi

// 1. GET Monitors (Hanya tampilkan punya user yang login)
router.get('/monitors', auth, async (req, res) => {
    try {
        const userId = req.userId; // Didapat dari token
        const [rows] = await db.query('SELECT * FROM monitors WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. POST Monitor (Simpan dengan menandai siapa pemiliknya)
router.post('/monitors', auth, async (req, res) => {
    const { name, url } = req.body;
    const userId = req.userId;

    try {
        const [result] = await db.query(
            'INSERT INTO monitors (name, url, user_id) VALUES (?, ?, ?)',
            [name, url, userId]
        );
        res.json({ id: result.insertId, name, url, status: 'PENDING' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. DELETE Monitor (Hapus cuma boleh kalau itu punya dia)
router.delete('/monitors/:id', auth, async (req, res) => {
    const { id } = req.params;
    const userId = req.userId;

    try {
        // Cek dulu apakah monitor ini milik user tersebut?
        const [check] = await db.query('SELECT * FROM monitors WHERE id = ? AND user_id = ?', [id, userId]);
        
        if (check.length === 0) {
            return res.status(404).json({ error: "Monitor tidak ditemukan atau bukan milik Anda" });
        }

        await db.query('DELETE FROM monitors WHERE id = ?', [id]);
        res.json({ message: 'Monitor deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. GET Logs (Perlu Auth juga biar aman)
router.get('/monitors/:id/logs', auth, async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query(
            'SELECT status, response_time, checked_at FROM logs WHERE monitor_id = ? ORDER BY checked_at DESC LIMIT 20',
            [id]
        );
        res.json(rows.reverse());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;