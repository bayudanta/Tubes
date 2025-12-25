require('dotenv').config();
const express = require('express');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = 5002;

app.use(express.json());
app.use(cors());

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
let bot = null;

if (token) {
    bot = new TelegramBot(token, { polling: false }); 
    console.log("✅ Telegram Bot Service Siap!");
} else {
    console.error("❌ TELEGRAM_BOT_TOKEN belum disetting!");
}

app.post('/notify', async (req, res) => {
    const { monitorName, status, url, time } = req.body;

    console.log(`📨 Menerima request notifikasi untuk: ${monitorName}`);

    const icon = status === 'UP' ? '✅' : '🔴';
    const statusText = status === 'UP' ? 'RECOVERED (UP)' : 'CRITICAL (DOWN)';

    const message = `
${icon} <b>Monitor Alert: ${monitorName}</b>

<b>Status:</b> ${statusText}
<b>Time:</b> ${time}
<b>URL:</b> ${url}

<i>— Uptime Checker System —</i>
`;

    try {
        if (bot && chatId) {
            await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
            console.log("🚀 Pesan terkirim ke Telegram");
            res.json({ success: true, message: 'Notifikasi terkirim ke Telegram' });
        } else {
            console.error("Gagal kirim: Token atau Chat ID kosong.");
            res.status(500).json({ error: 'Konfigurasi Telegram belum lengkap' });
        }
    } catch (error) {
        console.error("Telegram Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🔔 Notification Service running on port ${PORT}`);
});