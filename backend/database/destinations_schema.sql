-- =====================================================
-- DESTINATIONS TABLE SCHEMA
-- Stores Indian travel destination information
-- =====================================================

-- Disable foreign key checks to allow dropping table
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing table to ensure clean schema
DROP TABLE IF EXISTS destinations;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE destinations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    state VARCHAR(100) NOT NULL,
    category ENUM('Beach', 'Hill Station', 'Heritage', 'Nature', 'City', 'Spiritual') NOT NULL,
    description TEXT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    rating DECIMAL(3, 2) DEFAULT 4.00 CHECK (rating >= 0 AND rating <= 5),
    average_budget DECIMAL(10, 2) NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_destination (name, state),
    INDEX idx_category (category),
    INDEX idx_state (state),
    INDEX idx_featured (is_featured),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INDIAN TOURIST DESTINATIONS SEED DATA
-- Premium destinations across India
-- =====================================================

INSERT INTO destinations (name, state, category, description, image_url, rating, average_budget, is_featured) VALUES

-- Tamil Nadu Destinations
('Ooty', 'Tamil Nadu', 'Hill Station', 'Queen of Hill Stations nestled in the Nilgiri Mountains, famous for tea gardens, botanical gardens, and pleasant weather year-round.', 'https://images.unsplash.com/photo-1629011747727-1e012c71cf77?w=1200&q=80', 4.70, 3500.00, TRUE),
('Kodaikanal', 'Tamil Nadu', 'Hill Station', 'Princess of Hill Stations known for star-shaped lake, pine forests, waterfalls, and breathtaking viewpoints at Coaker''s Walk.', 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=1200&q=80', 4.60, 4000.00, FALSE),
('Rameswaram', 'Tamil Nadu', 'Spiritual', 'Sacred island pilgrimage destination housing the iconic Ramanathaswamy Temple with its magnificent corridor of 1000 pillars.', 'https://images.unsplash.com/photo-1621427642069-dbe095b6ea8a?w=1200&q=80', 4.50, 2500.00, FALSE),
('Mahabalipuram', 'Tamil Nadu', 'Heritage', 'UNESCO World Heritage Site featuring ancient shore temples, rock-cut caves, and the famous Five Rathas carved from single rocks.', 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200&q=80', 4.60, 2000.00, FALSE),
('Madurai', 'Tamil Nadu', 'Heritage', 'Ancient temple city home to the magnificent Meenakshi Amman Temple, known for its stunning Dravidian architecture and vibrant culture.', 'https://images.unsplash.com/photo-1577741314755-048d8525d31e?w=1200&q=80', 4.50, 2500.00, FALSE),
('Kanyakumari', 'Tamil Nadu', 'Nature', 'Southernmost tip of India where three seas meet, offering spectacular sunrise and sunset views along with the Vivekananda Rock Memorial.', 'https://images.unsplash.com/photo-1590766940554-634f4c5e7e36?w=1200&q=80', 4.70, 3000.00, TRUE),

-- Kerala Destinations
('Munnar', 'Kerala', 'Hill Station', 'Breathtaking hill station covered with endless tea plantations, misty mountains, rare Neelakurinji flowers, and exotic wildlife.', 'https://images.unsplash.com/photo-1593693411515-c20261bcad6e?w=1200&q=80', 4.80, 5000.00, TRUE),
('Alleppey', 'Kerala', 'Nature', 'Venice of the East famous for serene backwater cruises on traditional houseboats, coconut groves, and tranquil paddy fields.', 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&q=80', 4.70, 6000.00, TRUE),
('Wayanad', 'Kerala', 'Nature', 'Lush green paradise in Western Ghats featuring ancient caves, majestic waterfalls, wildlife sanctuaries, and spice plantations.', 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&q=80', 4.60, 4500.00, FALSE),
('Thekkady', 'Kerala', 'Nature', 'Home to Periyar Wildlife Sanctuary with dense forests, exotic wildlife including elephants and tigers, and aromatic spice gardens.', 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=1200&q=80', 4.50, 4000.00, FALSE),

-- Karnataka Destinations
('Coorg', 'Karnataka', 'Hill Station', 'Scotland of India blessed with misty hills, sprawling coffee plantations, thundering waterfalls, and rich Kodava heritage.', 'https://images.unsplash.com/photo-1571018057119-0e64f34115c5?w=1200&q=80', 4.70, 5500.00, TRUE),
('Hampi', 'Karnataka', 'Heritage', 'UNESCO World Heritage Site with magnificent ruins of Vijayanagara Empire, boulder-strewn landscapes, and ancient temple complexes.', 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=1200&q=80', 4.80, 2500.00, TRUE),
('Mysore', 'Karnataka', 'Heritage', 'City of Palaces showcasing the illuminated Mysore Palace, Chamundi Hills, traditional silk weaving, and famous Dasara celebrations.', 'https://images.unsplash.com/photo-1600112356813-44e81bc26d53?w=1200&q=80', 4.60, 3500.00, FALSE),
('Gokarna', 'Karnataka', 'Beach', 'Pristine beach town with secluded Om Beach, ancient Mahabaleshwar Temple, and laid-back hippie vibes perfect for beach lovers.', 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=80', 4.50, 3000.00, FALSE),

-- Goa Destinations
('North Goa', 'Goa', 'Beach', 'Vibrant beach paradise featuring Baga, Calangute, and Anjuna beaches, exciting nightlife, water sports, and Portuguese heritage.', 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200&q=80', 4.70, 7000.00, TRUE),
('South Goa', 'Goa', 'Beach', 'Serene coastal haven with pristine Palolem and Colva beaches, luxury resorts, quiet villages, and authentic Goan cuisine.', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80', 4.60, 8000.00, FALSE),

-- Rajasthan Destinations
('Jaipur', 'Rajasthan', 'Heritage', 'The Pink City adorned with magnificent Amber Fort, Hawa Mahal, City Palace, and colorful bazaars selling traditional crafts.', 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1200&q=80', 4.70, 4500.00, TRUE),
('Udaipur', 'Rajasthan', 'Heritage', 'City of Lakes featuring romantic Lake Palace, majestic City Palace, stunning sunset views, and royal Rajasthani hospitality.', 'https://images.unsplash.com/photo-1568495248636-6432b97bd949?w=1200&q=80', 4.80, 5000.00, TRUE),
('Jaisalmer', 'Rajasthan', 'Heritage', 'Golden City rising from Thar Desert with magnificent sandstone fort, ornate havelis, and magical desert safari experiences.', 'https://images.unsplash.com/photo-1587135941948-670b381f08ce?w=1200&q=80', 4.70, 4000.00, FALSE),
('Mount Abu', 'Rajasthan', 'Hill Station', 'Only hill station of Rajasthan featuring cool climate, sacred Dilwara Temples, serene Nakki Lake, and stunning sunset points.', 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1200&q=80', 4.40, 3500.00, FALSE),

-- Himachal Pradesh Destinations
('Manali', 'Himachal Pradesh', 'Hill Station', 'Adventure capital of Himachal with snow-capped peaks, Solang Valley adventures, ancient temples, and scenic Rohtang Pass.', 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&q=80', 4.70, 5500.00, TRUE),
('Shimla', 'Himachal Pradesh', 'Hill Station', 'Queen of Hills with colonial charm, Mall Road shopping, toy train rides, and panoramic Himalayan views from Ridge.', 'https://images.unsplash.com/photo-1597074866923-dc0589150358?w=1200&q=80', 4.60, 5000.00, FALSE),
('Dharamshala', 'Himachal Pradesh', 'Spiritual', 'Home of Dalai Lama and Tibetan government-in-exile, featuring Buddhist monasteries, cricket stadium, and trekking trails.', 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=1200&q=80', 4.50, 4000.00, FALSE),

-- Uttarakhand Destinations
('Rishikesh', 'Uttarakhand', 'Spiritual', 'Yoga Capital of the World on banks of holy Ganges, famous for adventure sports, ancient ashrams, and spiritual retreats.', 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=1200&q=80', 4.70, 3500.00, TRUE),
('Mussoorie', 'Uttarakhand', 'Hill Station', 'Queen of Hills offering colonial-era charm, Gun Hill views, Kempty Falls, and romantic Mall Road walks amidst misty mountains.', 'https://images.unsplash.com/photo-1600011689032-8b628b8a8747?w=1200&q=80', 4.50, 4000.00, FALSE),
('Nainital', 'Uttarakhand', 'Hill Station', 'Lake District of India centered around emerald Naini Lake, surrounded by seven hills and offering cable car rides to Snow View.', 'https://images.unsplash.com/photo-1564574685150-56e5fb3173c6?w=1200&q=80', 4.60, 4500.00, FALSE),

-- Jammu & Kashmir Destinations
('Srinagar', 'Jammu & Kashmir', 'Nature', 'Paradise on Earth featuring iconic Dal Lake houseboats, Mughal Gardens, traditional Shikara rides, and vibrant floating markets.', 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1200&q=80', 4.80, 8000.00, TRUE),
('Gulmarg', 'Jammu & Kashmir', 'Nature', 'Meadow of Flowers transformed into premier ski destination with Asia''s highest gondola ride and breathtaking alpine scenery.', 'https://images.unsplash.com/photo-1580289143186-d99d4f86d449?w=1200&q=80', 4.70, 7500.00, FALSE),
('Pahalgam', 'Jammu & Kashmir', 'Nature', 'Valley of Shepherds offering pristine Lidder River, pine forests, Betaab Valley meadows, and gateway to Amarnath pilgrimage.', 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=1200&q=80', 4.60, 7000.00, FALSE),

-- Maharashtra Destinations
('Mumbai', 'Maharashtra', 'City', 'Maximum City blending Gateway of India, Marine Drive sunsets, Bollywood glamour, street food delights, and diverse culture.', 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=1200&q=80', 4.50, 6000.00, FALSE),
('Lonavala', 'Maharashtra', 'Hill Station', 'Popular hill retreat near Mumbai famous for misty valleys, ancient Karla Caves, Bhushi Dam, and delectable chikki sweets.', 'https://images.unsplash.com/photo-1564174942466-bfa64b891c74?w=1200&q=80', 4.40, 4000.00, FALSE),
('Mahabaleshwar', 'Maharashtra', 'Hill Station', 'Strawberry country offering lush green valleys, majestic viewpoints, ancient temples, and fresh mountain air retreat.', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80', 4.50, 4500.00, FALSE),

-- West Bengal Destinations
('Darjeeling', 'West Bengal', 'Hill Station', 'Queen of Hills famous for world-renowned tea gardens, Tiger Hill sunrise, toy train heritage ride, and Kanchenjunga views.', 'https://images.unsplash.com/photo-1544634076-a90e67299c07?w=1200&q=80', 4.70, 5000.00, TRUE),
('Sundarbans', 'West Bengal', 'Nature', 'UNESCO World Heritage mangrove delta home to Royal Bengal Tigers, unique ecosystem, and thrilling boat safaris through creeks.', 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=1200&q=80', 4.50, 6000.00, FALSE),

-- Uttar Pradesh Destinations
('Agra', 'Uttar Pradesh', 'Heritage', 'Home to iconic Taj Mahal, magnificent Agra Fort, and Fatehpur Sikri showcasing pinnacle of Mughal architectural brilliance.', 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1200&q=80', 4.90, 4000.00, TRUE),
('Varanasi', 'Uttar Pradesh', 'Spiritual', 'Oldest living city and spiritual heart of India, famous for sacred Ganges ghats, evening Aarti ceremony, and ancient temples.', 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=1200&q=80', 4.70, 3500.00, TRUE),

-- Assam Destination
('Kaziranga', 'Assam', 'Nature', 'UNESCO World Heritage Site protecting two-thirds of world''s one-horned rhinoceros, with elephant safaris through grasslands.', 'https://images.unsplash.com/photo-1557764824-1db5a4c2e12b?w=1200&q=80', 4.60, 8000.00, FALSE);
