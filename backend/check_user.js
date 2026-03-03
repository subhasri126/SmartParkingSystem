const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'd:\\travel\\travel\\backend\\.env' });

async function checkUser(email) {
    let connection;
    try {
        console.log(`Checking for user: ${email}`);
        console.log(`DB_PASSWORD in env: ${process.env.DB_PASSWORD}`);

        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        const [rows] = await connection.execute('SELECT id, full_name, email, is_verified FROM users WHERE email = ?', [email]);

        if (rows.length > 0) {
            console.log('User found:', rows[0]);
        } else {
            console.log('User NOT found.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

const args = process.argv.slice(2);
const emailToCheck = args[0] || 'subhasris126@gmail.com';
checkUser(emailToCheck);
