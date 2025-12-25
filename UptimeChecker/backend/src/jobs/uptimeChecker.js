const cron = require('node-cron');
const axios = require('axios');
const db = require('../config/db');

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

            await db.query(
                'INSERT INTO logs (monitor_id, status, response_time) VALUES (?, ?, ?)',
                [monitor.id, newStatus, responseTime]
            );

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

const startMonitoring = () => {
    cron.schedule('* * * * *', checkSites);
    console.log('⏰ Uptime Monitor Job Started (Every 1 Minute)');
};

module.exports = startMonitoring;