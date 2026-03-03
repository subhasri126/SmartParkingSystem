const pool = require('../config/db');

const simpleLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password required" });
        }
        const [rows] = await pool.query('SELECT id, full_name, email, password FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        const user = rows[0];
        if (user.password !== password) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        return res.json({
            success: true,
            message: "Login successful",
            user: { id: user.id, name: user.full_name, email: user.email }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = { simpleLogin };