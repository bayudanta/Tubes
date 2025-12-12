const cron = require('node-cron');
const axios = require('axios');
const db = require('../config/db');

const checkSites = async () => {
    console.log('🔄 Memulai pengecekan website...');

    try {
        const [monitors] = await db.query('SELECT * FROM monitors');

        monitors.forEach(async (monitor) => {
            const start = Date.now(); 
            let status = 'DOWN';
            let responseTime = 0;

            try {
                await axios.get(monitor.url, { timeout: 5000 });
                status = 'UP';
                responseTime = Date.now() - start; 
            } catch (error) {
                responseTime = Date.now() - start;
                console.error(`❌ ${monitor.name} is DOWN: ${error.message}`);
            }

            await db.query(
                'INSERT INTO logs (monitor_id, status, response_time) VALUES (?, ?, ?)',
                [monitor.id, status, responseTime]
            );

            await db.query(
                'UPDATE monitors SET status = ? WHERE id = ?',
                [status, monitor.id]
            );

            console.log(`✅ Checked ${monitor.name}: ${status} (${responseTime}ms)`);
        });

    } catch (error) {
        console.error('Error fetching monitors:', error);
    }
};

const startMonitoring = () => {
    cron.schedule('* * * * *', checkSites);
    console.log('⏰ Uptime Monitor Job Started (Every 1 Minute)');
};

module.exports = startMonitoring;