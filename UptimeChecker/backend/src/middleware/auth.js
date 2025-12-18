const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Ambil token dari header "Authorization"
    const tokenHeader = req.headers['authorization'];
    
    // Jika tidak ada token, tolak!
    if (!tokenHeader) return res.status(403).json({ error: "Akses ditolak. Token tidak ada." });

    // Format token biasanya "Bearer <isi_token_panjang>"
    const token = tokenHeader.split(' ')[1]; // Ambil bagian isi_token saja

    if (!token) return res.status(403).json({ error: "Format token salah." });

    // Cek keaslian token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Token tidak valid atau kadaluarsa." });
        
        // Token Asli! Simpan ID user agar bisa dipakai di route
        req.userId = decoded.id; 
        next(); // Lanjut ke proses berikutnya
    });
};

module.exports = verifyToken;