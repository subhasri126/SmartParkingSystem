// =====================================================
// SETUP DESTINATIONS TABLE AND SEED DATA
// Run this script to initialize the destinations module
// =====================================================

const fs = require('fs');
const path = require('path');
const { pool } = require('./config/database');

async function setupDestinations() {
    try {
        console.log('🚀 Starting destinations setup...\n');

        // Read SQL file
        const sqlFilePath = path.join(__dirname, 'database', 'destinations_schema.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        console.log('📄 SQL file loaded successfully');

        // Split SQL content by semicolons to execute multiple statements
        const statements = sqlContent
            .split(';')
            .filter(stmt => stmt.trim().length > 0);

        console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            if (statement) {
                console.log(`Executing statement ${i + 1}/${statements.length}...`);
                
                try {
                    await pool.execute(statement);
                    console.log(`✅ Statement ${i + 1} executed successfully`);
                } catch (error) {
                    // If it's just a warning about table already exists, continue
                    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
                        console.log(`⚠️  Table already exists, continuing...`);
                    } else {
                        throw error;
                    }
                }
            }
        }

        // Verify data
        console.log('\n🔍 Verifying destinations data...');
        const [rows] = await pool.execute('SELECT COUNT(*) as count FROM destinations');
        const count = rows[0].count;

        console.log(`✅ Successfully inserted ${count} destinations\n`);

        // Show sample destinations
        const [sampleRows] = await pool.execute('SELECT id, name, state, rating FROM destinations LIMIT 5');
        console.log('📍 Sample destinations:');
        sampleRows.forEach(dest => {
            console.log(`   ${dest.id}. ${dest.name}, ${dest.state} (⭐ ${dest.rating})`);
        });

        console.log('\n✅ Destinations setup completed successfully! 🎉');
        console.log('\n💡 You can now start the server with: npm run dev');

    } catch (error) {
        console.error('\n❌ Error setting up destinations:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        // Close the pool
        await pool.end();
    }
}

// Run the setup
setupDestinations();
