const pool = require('./config/db');

(async () => {
  try {
    console.log('🔄 Seeding comprehensive hotel and tourist spot data...\n');

    // Get all destinations
    const [destinations] = await pool.query('SELECT id, name, category FROM destinations LIMIT 20');
    console.log(`Found ${destinations.length} destinations\n`);

    // Clear existing data
    await pool.query('DELETE FROM hotels');
    await pool.query('DELETE FROM tourist_spots');
    console.log('✓ Cleared existing data\n');

    // Hotel data by category
    const hotelTemplates = {
      beach: [
        { name: 'Beachfront Paradise Resort', price: 4500, rating: 4.8, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80', desc: 'Luxury beachfront resort with stunning ocean views and premium amenities' },
        { name: 'Seaside Boutique Hotel', price: 3200, rating: 4.6, image: 'https://images.unsplash.com/photo-1520763185298-1b434c919abe?w=600&q=80', desc: 'Charming boutique hotel steps away from pristine beaches' },
        { name: 'Coastal Inn & Suites', price: 1800, rating: 4.3, image: 'https://images.unsplash.com/photo-1570129477492-45a003537e1f?w=600&q=80', desc: 'Comfortable and affordable accommodation near the beach' }
      ],
      mountain: [
        { name: 'Mountain Peak Lodge', price: 3800, rating: 4.7, image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80', desc: 'Cozy mountain lodge with panoramic valley views' },
        { name: 'Highland Resort & Spa', price: 2900, rating: 4.5, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80', desc: 'Mountain resort with spa facilities and trekking access' },
        { name: 'Valley View Hotel', price: 1500, rating: 4.2, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80', desc: 'Budget-friendly hotel with mountain views' }
      ],
      cultural: [
        { name: 'Heritage Palace Hotel', price: 4200, rating: 4.9, image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80', desc: 'Historic palace converted into luxury hotel with royal ambiance' },
        { name: 'Cultural Heritage Inn', price: 2600, rating: 4.6, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80', desc: 'Traditional architecture with modern comforts in heritage zone' },
        { name: 'Old City Guest House', price: 1200, rating: 4.1, image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&q=80', desc: 'Authentic guesthouse in the heart of cultural district' }
      ],
      city: [
        { name: 'Grand Metropolitan Hotel', price: 5000, rating: 4.8, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80', desc: 'Upscale city center hotel with business and leisure facilities' },
        { name: 'Urban Suites Downtown', price: 3500, rating: 4.5, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80', desc: 'Modern suites in prime downtown location' },
        { name: 'City Budget Inn', price: 1600, rating: 4.0, image: 'https://images.unsplash.com/photo-1529290130-4ca3753253ae?w=600&q=80', desc: 'Affordable accommodation with city access' }
      ],
      default: [
        { name: 'Grand Destination Hotel', price: 4000, rating: 4.7, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80', desc: 'Premier hotel offering world-class amenities' },
        { name: 'Comfort Inn & Suites', price: 2500, rating: 4.4, image: 'https://images.unsplash.com/photo-1520763185298-1b434c919abe?w=600&q=80', desc: 'Comfortable mid-range hotel with excellent service' },
        { name: 'Traveler\'s Lodge', price: 1400, rating: 4.1, image: 'https://images.unsplash.com/photo-1570129477492-45a003537e1f?w=600&q=80', desc: 'Budget-friendly option for value travelers' }
      ]
    };

    // Tourist spot data by category
    const spotTemplates = {
      beach: [
        { name: 'Main Beach', desc: 'Pristine white sand beach perfect for swimming and sunbathing', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80', category: 'Beach' },
        { name: 'Sunset Point', desc: 'Scenic viewpoint famous for breathtaking sunset views', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', category: 'Nature' },
        { name: 'Water Sports Center', desc: 'Hub for exciting water activities like surfing and diving', image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600&q=80', category: 'Adventure' },
        { name: 'Beachside Market', desc: 'Local market with handicrafts, souvenirs, and fresh seafood', image: 'https://images.unsplash.com/photo-1544978167-f6b1bb3de0b7?w=600&q=80', category: 'Shopping' }
      ],
      mountain: [
        { name: 'Peak Summit', desc: 'Highest viewpoint offering panoramic mountain vistas', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', category: 'Nature' },
        { name: 'Forest Trail', desc: 'Scenic hiking trail through dense forests and streams', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80', category: 'Adventure' },
        { name: 'Mountain Temple', desc: 'Ancient temple located at high altitude with spiritual significance', image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=600&q=80', category: 'Cultural' },
        { name: 'Valley Viewpoint', desc: 'Spectacular valley views with photo opportunities', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', category: 'Nature' }
      ],
      cultural: [
        { name: 'Historic Palace', desc: 'Magnificent palace showcasing royal architecture and history', image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&q=80', category: 'Landmark' },
        { name: 'Ancient Temple Complex', desc: 'Sacred temple with intricate carvings and religious significance', image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=600&q=80', category: 'Cultural' },
        { name: 'Heritage Museum', desc: 'Museum displaying local art, artifacts, and cultural heritage', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80', category: 'Cultural' },
        { name: 'Traditional Bazaar', desc: 'Bustling market with handicrafts, textiles, and local cuisine', image: 'https://images.unsplash.com/photo-1544978167-f6b1bb3de0b7?w=600&q=80', category: 'Shopping' }
      ],
      city: [
        { name: 'Iconic Landmark', desc: 'Famous city landmark and must-visit attraction', image: 'https://images.unsplash.com/photo-1464082354059-27db6ce50048?w=600&q=80', category: 'Landmark' },
        { name: 'City Museum', desc: 'Modern museum showcasing art, history, and innovation', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80', category: 'Cultural' },
        { name: 'Shopping District', desc: 'Premier shopping area with designer stores and boutiques', image: 'https://images.unsplash.com/photo-1544978167-f6b1bb3de0b7?w=600&q=80', category: 'Shopping' },
        { name: 'City Park', desc: 'Urban green space perfect for relaxation and recreation', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80', category: 'Nature' }
      ],
      default: [
        { name: 'Main Attraction', desc: 'Popular landmark known for its unique features', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', category: 'Landmark' },
        { name: 'Natural Wonder', desc: 'Beautiful natural site with scenic beauty', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80', category: 'Nature' },
        { name: 'Local Market', desc: 'Vibrant market with local products and souvenirs', image: 'https://images.unsplash.com/photo-1544978167-f6b1bb3de0b7?w=600&q=80', category: 'Shopping' }
      ]
    };

    let hotelCount = 0;
    let spotCount = 0;

    // Insert data for each destination
    for (const dest of destinations) {
      const category = dest.category ? dest.category.toLowerCase() : 'default';
      const hotels = hotelTemplates[category] || hotelTemplates.default;
      const spots = spotTemplates[category] || spotTemplates.default;

      // Insert hotels
      for (const hotel of hotels) {
        await pool.query(
          'INSERT INTO hotels (destination_id, name, price_per_night, rating, image_url, description) VALUES (?, ?, ?, ?, ?, ?)',
          [dest.id, hotel.name, hotel.price, hotel.rating, hotel.image, hotel.desc]
        );
        hotelCount++;
      }

      // Insert tourist spots
      for (const spot of spots) {
        await pool.query(
          'INSERT INTO tourist_spots (destination_id, name, description, image_url, category) VALUES (?, ?, ?, ?, ?)',
          [dest.id, spot.name, spot.desc, spot.image, spot.category]
        );
        spotCount++;
      }

      console.log(`✓ Seeded ${dest.name} (${category})`);
    }

    console.log(`\n✅ Seeding complete!`);
    console.log(`   • Hotels: ${hotelCount} records`);
    console.log(`   • Tourist Spots: ${spotCount} records`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
