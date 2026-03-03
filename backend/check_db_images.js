const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'd:\\travel\\travel\\backend\\.env' });

async function checkImages() {
    let connection;
    try {
        console.log('Checking first 5 destinations...');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        const [rows] = await connection.execute('SELECT id, name, image_url FROM destinations LIMIT 5');
        rows.forEach(row => {
            console.log(`ID: ${row.id}, Name: ${row.name}`);
            console.log(`Image: ${row.image_url}`);
            console.log('-----------------------------------');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

checkImages();
