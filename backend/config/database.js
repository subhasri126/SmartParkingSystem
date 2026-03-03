// =====================================================
// DATABASE CONFIGURATION
// MySQL Connection Pool Setup
// =====================================================

const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Create MySQL connection pool for better performance
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Get promise-based connection
const promisePool = pool.promise();

// Test database connection
const testConnection = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ MySQL Database Connected Successfully');
        console.log(`   Host: ${process.env.DB_HOST}`);
        console.log(`   Database: ${process.env.DB_NAME}`);
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ MySQL Connection Error:', error.message);
        console.error('   Please verify database credentials in .env file');
        return false;
    }
};

// Graceful shutdown
const closePool = () => {
    return new Promise((resolve, reject) => {
        pool.end((err) => {
            if (err) {
                console.error('❌ Error closing MySQL pool:', err);
                reject(err);
            } else {
                console.log('✅ MySQL pool closed');
                resolve();
            }
        });
    });
};

module.exports = {
    pool: promisePool,
    testConnection,
    closePool
};
