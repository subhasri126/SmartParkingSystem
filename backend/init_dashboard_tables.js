const pool = require("./config/db");
const fs = require("fs");
const path = require("path");

async function initializeDashboardTables() {
    console.log("🚀 Initializing dashboard tables...");

    try {
        // Read the SQL schema file
        const schemaPath = path.join(__dirname, "database", "dashboard_schema.sql");
        const schema = fs.readFileSync(schemaPath, "utf8");

        // Split the schema by semicolons to execute each CREATE TABLE separately
        const statements = schema
            .split(";")
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        // Execute each statement
        for (const statement of statements) {
            await pool.query(statement);
            console.log("✅ Executed statement successfully");
        }

        console.log("\n✅ Dashboard tables created successfully!");
        console.log("\nTables created:");
        console.log("- user_search_history");
        console.log("- hotel_bookings");
        console.log("- user_reviews");

        // Verify tables were created
        const [tables] = await pool.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'voyago_db' 
            AND TABLE_NAME IN ('user_search_history', 'hotel_bookings', 'user_reviews')
        `);

        console.log("\n📊 Verification:");
        tables.forEach(table => {
            console.log(`✓ ${table.TABLE_NAME} exists`);
        });

        process.exit(0);
    } catch (error) {
        console.error("❌ Error initializing dashboard tables:", error);
        process.exit(1);
    }
}

initializeDashboardTables();
