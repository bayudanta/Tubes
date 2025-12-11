const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/monitors', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM monitors ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/monitors', async (req, res) => {
    const { name, url } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO monitors (name, url) VALUES (?, ?)',
            [name, url]
        );
        res.json({ id: result.insertId, name, url, status: 'PENDING' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/monitors/:id/logs', async (req, res) => {
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

router.delete('/monitors/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM monitors WHERE id = ?', [id]);
        res.json({ message: 'Monitor deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;