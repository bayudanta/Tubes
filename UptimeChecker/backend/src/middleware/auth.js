const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const tokenHeader = req.headers['authorization'];
    
    if (!tokenHeader) return res.status(403).json({ error: "Akses ditolak. Token tidak ada." });


    const token = tokenHeader.split(' ')[1]; 

    if (!token) return res.status(403).json({ error: "Format token salah." });


    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Token tidak valid atau kadaluarsa." });
        

        req.userId = decoded.id; 
        next(); 
    });
};

module.exports = verifyToken;