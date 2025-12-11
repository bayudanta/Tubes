require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./src/config/db'); // Import db yang sudah kita edit
const apiRoutes = require('./src/routes/apiRoutes');
const startMonitoring = require('./src/jobs/uptimeChecker');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.send('🚀 Uptime Monitor Backend is Running!');
});


const startServer = async () => {
    await db.initDb();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        
        startMonitoring();
    });
};

startServer();