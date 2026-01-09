const cron = require('node-cron');
const axios = require('axios');
const db = require('../config/db');

// --- TUGAS 1: CEK WEBSITE & KIRIM NOTIFIKASI ---
const checkSites = async () => {
    console.log('🔄 Memulai pengecekan website...');

    try {
        const [monitors] = await db.query('SELECT * FROM monitors');

        for (const monitor of monitors) {
            const start = Date.now(); 
            let newStatus = 'DOWN';
            let responseTime = 0;

            try {
                await axios.get(monitor.url, { timeout: 5000 });
                newStatus = 'UP';
                responseTime = Date.now() - start; 
            } catch (error) {
                responseTime = Date.now() - start;
                console.error(`❌ ${monitor.name} is DOWN: ${error.message}`);
            }

            if (monitor.status !== newStatus) {
                console.log(`⚠️ ALERT: ${monitor.name} berubah dari ${monitor.status} menjadi ${newStatus}`);
                
                try {
                    // Tembak ke Notification Service
                    await axios.post('http://notification-service:5002/notify', {
                        monitorName: monitor.name,
                        status: newStatus,
                        url: monitor.url,
                        time: new Date().toLocaleString()
                    });
                    console.log(`📨 Notifikasi sukses dikirim ke Telegram!`);
                } catch (notifError) {
                    console.error(`❌ Gagal lapor ke Notification Service: ${notifError.message}`);
                }
            }

            // Simpan Log History
            await db.query(
                'INSERT INTO logs (monitor_id, status, response_time) VALUES (?, ?, ?)',
                [monitor.id, newStatus, responseTime]
            );

            // Update Status Terkini di DB
            await db.query(
                'UPDATE monitors SET status = ? WHERE id = ?',
                [newStatus, monitor.id]
            );

            console.log(`✅ Checked ${monitor.name}: ${newStatus} (${responseTime}ms)`);
        }

    } catch (error) {
        console.error('Error fetching monitors:', error);
    }
};

// --- TUGAS 2: BERSIHKAN LOG LAMA  ---
const cleanupLogs = async () => {
    console.log('🧹 Memulai pembersihan log otomatis...');
    try {
        const [result] = await db.query("DELETE FROM logs WHERE checked_at < NOW() - INTERVAL 7 DAY");
        
        console.log(`✅ Logs lama berhasil dibersihkan.`);
        console.log(`🗑️ Jumlah data dihapus: ${result.affectedRows} baris.`);
    } catch (err) {
        console.error('❌ Gagal membersihkan logs:', err.message);
    }
};

// --- JADWAL CRON JOB ---
const startMonitoring = () => {
    // 1. Cek Website Setiap 1 Menit
    cron.schedule('* * * * *', checkSites);
    
    // 2. Bersihkan Log Setiap Jam 00:00 (Tengah Malam)
    cron.schedule('0 0 * * *', cleanupLogs);
    
    console.log('⏰ Uptime Monitor Started (Check: 1m | Cleanup: 24h)');
};

module.exports = startMonitoring;