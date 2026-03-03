const pool = require('./config/db');

(async () => {
  try {
    const updates = [
      ['Ooty', 'images/ooty-hills.jpg'],
      ['Kodaikanal', 'images/kodaikanal-lake.jpg'],
      ['Mahabalipuram', 'images/mahabalipuram-temple.jpg'],
      ['Rameswaram', 'images/rameswaram-temple.jpg'],
      ['Kanyakumari', 'images/kanyakumari-sunrise.jpg'],
      ['Munnar', 'images/munnar-tea.jpg'],
      ['Alleppey', 'images/alleppey-backwater.jpg'],
      ['Coorg', 'images/coorg-coffee.jpg'],
      ['Hampi', 'images/hampi-ruins.jpg'],
      ['Jaipur', 'images/jaipur-palace.jpg'],
      ['Manali', 'images/manali-snow.jpg'],
      ['Shimla', 'images/shimla-hills.jpg'],
      ['Srinagar', 'images/srinagar-dallake.jpg'],
      ['Mumbai', 'images/mumbai-skyline.jpg'],
      ['Goa', 'images/goa-beach.jpg'],
      ['Delhi', 'images/delhi-monument.jpg']
    ];

    let updated = 0;
    for (const [name, imagePath] of updates) {
      await pool.query('UPDATE destinations SET image_url = ? WHERE name = ?', [imagePath, name]);
      updated++;
    }

    console.log('Updated:', updated, 'Indian destinations with category-based image paths');
    
    const [result] = await pool.query('SELECT name, image_url FROM destinations WHERE country = ? ORDER BY name', ['India']);
    console.log('\nUpdated Indian destinations:');
    result.forEach(d => {
      console.log(`  - ${d.name}: ${d.image_url}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
