const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: 'd:\\travel\\travel\\backend\\.env' });

async function resetUser(email, newPassword) {
    let connection;
    try {
        console.log(`Resetting user: ${email}`);

        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        // 1. Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 2. Update user: Password = newPassword, is_verified = 1
        const [result] = await connection.execute(
            'UPDATE users SET password = ?, is_verified = 1 WHERE email = ?',
            [hashedPassword, email]
        );

        if (result.affectedRows > 0) {
            console.log(`✅ Success! User ${email} updated.`);
            console.log(`New Password: ${newPassword}`);
            console.log(`Status: Verified (is_verified = 1)`);
        } else {
            console.log(`❌ User ${email} not found.`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

const email = 'subhasris126@gmail.com';
const password = 'Subhasri@2006';

resetUser(email, password);
