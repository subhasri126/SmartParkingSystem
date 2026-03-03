const pool = require('./config/db');

(async () => {
  try {
    // Update with high-quality unique Unsplash URLs for each Indian destination
    const updates = [
      // Mountains & Hills
      ['Ooty', 'https://images.unsplash.com/photo-1472791108553-6e40c6e022e6?w=800&q=80'], // Mountain landscape
      ['Kodaikanal', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80'], // Misty mountains
      ['Munnar', 'https://images.unsplash.com/photo-1469022563149-aa64dbd37dae?w=800&q=80'], // Green tea fields
      ['Manali', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80'], // Snow peaks
      ['Shimla', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80'], // Hill station beauty
      ['Coorg', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80'], // Lush green hills
      
      // Temples & Cultural
      ['Mahabalipuram', 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&q=80'], // Ancient temple
      ['Rameswaram', 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80'], // Sacred temple
      ['Hampi', 'https://images.unsplash.com/photo-1504681869696-d977e3a6d71d?w=800&q=80'], // Historic ruins
      ['Jaipur', 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80'], // Pink Palace
      ['Delhi', 'https://images.unsplash.com/photo-1588618882106-bb92a26a3e3d?w=800&q=80'], // Monument architecture
      
      // Beaches & Backwaters
      ['Goa', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'], // Golden beach
      ['Kanyakumari', 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&q=80'], // Ocean waves
      ['Alleppey', 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80'], // Backwater boats
      
      // Lakes & Water
      ['Srinagar', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80'], // Dal Lake beauty
      
      // Cities
      ['Mumbai', 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80'] // City skyline
    ];

    let updated = 0;
    console.log('Updating Indian destinations with attractive images...\n');
    
    for (const [name, imagePath] of updates) {
      await pool.query('UPDATE destinations SET image_url = ? WHERE name = ?', [imagePath, name]);
      updated++;
      console.log(`✓ ${name}`);
    }

    console.log(`\n✅ Updated: ${updated} Indian destinations with unique attractive images`);
    
    // Verify updates
    const [result] = await pool.query('SELECT name, image_url FROM destinations WHERE country = ? ORDER BY name', ['India']);
    console.log('\nVerification - Sample Indian destinations:');
    result.slice(0, 6).forEach(d => {
      console.log(`  - ${d.name}: ✓ Updated with unique image`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
