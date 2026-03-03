const pool = require('./config/db');

(async () => {
  try {
    console.log('🔄 Initializing database tables...\n');

    // Create hotels table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hotels (
        id INT PRIMARY KEY AUTO_INCREMENT,
        destination_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        price_per_night DECIMAL(10, 2) NOT NULL,
        rating FLOAT DEFAULT 4.5,
        image_url VARCHAR(500),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (destination_id) REFERENCES destinations(id),
        INDEX idx_destination (destination_id)
      )
    `);
    console.log('✓ Hotels table created');

    // Create tourist_spots table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tourist_spots (
        id INT PRIMARY KEY AUTO_INCREMENT,
        destination_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (destination_id) REFERENCES destinations(id),
        INDEX idx_destination (destination_id)
      )
    `);
    console.log('✓ Tourist Spots table created');

    // Check if data exists, if not insert sample data
    const [hotelCount] = await pool.query('SELECT COUNT(*) as count FROM hotels');
    if (hotelCount[0].count === 0) {
      // Get first destination for sample data
      const [dest] = await pool.query('SELECT id FROM destinations LIMIT 1');
      const destId = dest[0]?.id || 1;

      // Insert sample hotels
      await pool.query(`
        INSERT INTO hotels (destination_id, name, price_per_night, rating, image_url, description) VALUES
        (?, 'Grand Hotel Palace', 5000, 4.8, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80', '5-star luxury hotel with premium amenities'),
        (?, 'Mountain View Resort', 3500, 4.6, 'https://images.unsplash.com/photo-1520763185298-1b434c919abe?w=600&q=80', 'Cozy resort with scenic mountain views'),
        (?, 'Budget Stay Inn', 1500, 4.2, 'https://images.unsplash.com/photo-1570129477492-45a003537e1f?w=600&q=80', 'Affordable comfortable accommodation')
      `, [destId, destId, destId]);
      console.log('✓ Sample hotels inserted');

      // Insert sample tourist spots
      await pool.query(`
        INSERT INTO tourist_spots (destination_id, name, description, image_url, category) VALUES
        (?, 'Main Landmark', 'Most famous attraction in the destination', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', 'Landmark'),
        (?, 'Nature Reserve', 'Beautiful natural area with diverse flora and fauna', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80', 'Nature'),
        (?, 'Local Market', 'Traditional market with authentic local products', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80', 'Shopping')
      `, [destId, destId, destId]);
      console.log('✓ Sample tourist spots inserted');
    } else {
      console.log('✓ Hotels and tourist spots data already exist');
    }

    // Verify tables
    const [hotels] = await pool.query('SELECT COUNT(*) as count FROM hotels');
    const [spots] = await pool.query('SELECT COUNT(*) as count FROM tourist_spots');

    console.log(`\n✅ Database initialization complete!`);
    console.log(`   • Hotels: ${hotels[0].count} records`);
    console.log(`   • Tourist Spots: ${spots[0].count} records`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
