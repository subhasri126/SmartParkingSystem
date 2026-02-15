-- =====================================================
-- DESTINATIONS TABLE SCHEMA
-- Stores travel destination information
-- =====================================================

CREATE TABLE IF NOT EXISTS destinations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    country VARCHAR(100) NOT NULL,
    continent VARCHAR(50) NOT NULL,
    category ENUM('Beach', 'Mountain', 'City', 'Cultural', 'Nature', 'Island', 'Desert') NOT NULL,
    description TEXT NOT NULL,
    price_starting DECIMAL(10, 2) NOT NULL,
    rating DECIMAL(3, 2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    image_url VARCHAR(500) NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_destination (name, country),
    INDEX idx_category (category),
    INDEX idx_country (country),
    INDEX idx_continent (continent),
    INDEX idx_featured (is_featured),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SEED DATA - 50 POPULAR DESTINATIONS
-- =====================================================

INSERT INTO destinations (name, country, continent, category, description, price_starting, rating, image_url, is_featured) VALUES
-- Featured Asian Destinations
('Bali', 'Indonesia', 'Asia', 'Island', 'Stunning beaches, ancient temples, and vibrant culture make Bali a tropical paradise perfect for relaxation and adventure.', 899.00, 4.8, 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80', TRUE),
('Tokyo', 'Japan', 'Asia', 'City', 'A perfect blend of ancient tradition and cutting-edge technology, Tokyo offers incredible food, shopping, and cultural experiences.', 1299.00, 4.9, 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80', TRUE),
('Maldives', 'Maldives', 'Asia', 'Island', 'Crystal-clear waters, overwater bungalows, and pristine beaches create the ultimate luxury tropical escape.', 2499.00, 4.9, 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&q=80', TRUE),

-- European Destinations
('Paris', 'France', 'Europe', 'City', 'The City of Light enchants with iconic landmarks, world-class museums, exquisite cuisine, and romantic ambiance.', 1199.00, 4.8, 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80', TRUE),
('Santorini', 'Greece', 'Europe', 'Island', 'White-washed buildings, stunning sunsets, and azure waters make Santorini one of the most picturesque islands in the world.', 1599.00, 4.9, 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=600&q=80', TRUE),
('Swiss Alps', 'Switzerland', 'Europe', 'Mountain', 'Majestic peaks, pristine lakes, and charming villages offer year-round outdoor adventures and breathtaking scenery.', 1899.00, 4.8, 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600&q=80', TRUE),
('Rome', 'Italy', 'Europe', 'Cultural', 'Ancient ruins, Renaissance art, and delicious cuisine immerse you in millennia of history and culture.', 1099.00, 4.7, 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80', FALSE),
('Barcelona', 'Spain', 'Europe', 'City', 'Gaudí architecture, Mediterranean beaches, and vibrant nightlife create an unforgettable urban experience.', 999.00, 4.7, 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80', FALSE),
('Iceland', 'Iceland', 'Europe', 'Nature', 'Glaciers, geysers, waterfalls, and the Northern Lights showcase nature at its most dramatic and beautiful.', 1799.00, 4.8, 'https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=600&q=80', FALSE),
('Amsterdam', 'Netherlands', 'Europe', 'City', 'Charming canals, world-class museums, and bicycle-friendly streets define this historic and progressive city.', 1049.00, 4.6, 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&q=80', FALSE),

-- American Destinations
('New York City', 'USA', 'North America', 'City', 'The city that never sleeps offers iconic landmarks, Broadway shows, diverse neighborhoods, and endless entertainment.', 1399.00, 4.7, 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80', TRUE),
('Machu Picchu', 'Peru', 'South America', 'Cultural', 'The ancient Incan citadel set high in the Andes is one of the most iconic archaeological sites in the world.', 1699.00, 4.9, 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=600&q=80', FALSE),
('Cancún', 'Mexico', 'North America', 'Beach', 'Turquoise waters, white sand beaches, and ancient Mayan ruins make Cancún a perfect tropical getaway.', 799.00, 4.6, 'https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=600&q=80', FALSE),
('Rio de Janeiro', 'Brazil', 'South America', 'Beach', 'Copacabana Beach, Christ the Redeemer, and Carnival energy make Rio an exhilarating destination.', 1299.00, 4.7, 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=600&q=80', FALSE),
('Grand Canyon', 'USA', 'North America', 'Nature', 'One of the world natural wonders, the Grand Canyon offers awe-inspiring views and outdoor adventures.', 899.00, 4.8, 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=600&q=80', FALSE),
('Banff', 'Canada', 'North America', 'Mountain', 'Turquoise lakes, snow-capped peaks, and abundant wildlife in the heart of the Canadian Rockies.', 1499.00, 4.8, 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=600&q=80', FALSE),

-- African Destinations
('Marrakech', 'Morocco', 'Africa', 'Cultural', 'Bustling souks, stunning palaces, and Sahara Desert adventures create an exotic Arabian Nights experience.', 999.00, 4.7, 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=600&q=80', FALSE),
('Cape Town', 'South Africa', 'Africa', 'Beach', 'Table Mountain, stunning coastlines, wineries, and diverse wildlife make Cape Town endlessly fascinating.', 1399.00, 4.7, 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=600&q=80', FALSE),
('Serengeti', 'Tanzania', 'Africa', 'Nature', 'Witness the Great Migration and incredible wildlife in one of Africa most famous safari destinations.', 2299.00, 4.9, 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=600&q=80', TRUE),
('Zanzibar', 'Tanzania', 'Africa', 'Island', 'Pristine beaches, turquoise waters, and rich Swahili culture create an idyllic island paradise.', 1199.00, 4.7, 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=600&q=80', FALSE),

-- Oceania Destinations
('Sydney', 'Australia', 'Oceania', 'City', 'The iconic Opera House, beautiful harbor, stunning beaches, and vibrant culture define Australia premier city.', 1699.00, 4.8, 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600&q=80', FALSE),
('Queenstown', 'New Zealand', 'Oceania', 'Mountain', 'Adventure capital of the world with stunning landscapes, skiing, bungee jumping, and outdoor activities.', 1599.00, 4.8, 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=600&q=80', FALSE),
('Bora Bora', 'French Polynesia', 'Oceania', 'Island', 'Overwater bungalows, crystal-clear lagoons, and Mount Otemanu create the ultimate romantic escape.', 3499.00, 4.9, 'https://images.unsplash.com/photo-1589197331516-2e3769339d14?w=600&q=80', TRUE),
('Great Barrier Reef', 'Australia', 'Oceania', 'Nature', 'The world largest coral reef system offers incredible snorkeling, diving, and marine life encounters.', 1899.00, 4.9, 'https://images.unsplash.com/photo-1582623930095-920c2a7c7b63?w=600&q=80', FALSE),

-- More Asian Destinations
('Dubai', 'UAE', 'Asia', 'City', 'Ultra-modern skyscrapers, luxury shopping, desert safaris, and world-class entertainment define this futuristic city.', 1499.00, 4.7, 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80', FALSE),
('Thailand', 'Thailand', 'Asia', 'Beach', 'Tropical beaches, ancient temples, delicious cuisine, and warm hospitality make Thailand a favorite destination.', 799.00, 4.7, 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&q=80', FALSE),
('Kyoto', 'Japan', 'Asia', 'Cultural', 'Ancient temples, traditional geisha districts, bamboo forests, and cherry blossoms preserve Japanese heritage.', 1199.00, 4.8, 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80', FALSE),
('Mount Everest Base Camp', 'Nepal', 'Asia', 'Mountain', 'Trek through the Himalayas to the base of the world highest peak for an unforgettable adventure.', 1999.00, 4.9, 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&q=80', FALSE),
('Angkor Wat', 'Cambodia', 'Asia', 'Cultural', 'The magnificent temple complex is the largest religious monument in the world and a UNESCO World Heritage site.', 899.00, 4.8, 'https://images.unsplash.com/photo-1563979520-1b97f7c3fea1?w=600&q=80', FALSE),
('Singapore', 'Singapore', 'Asia', 'City', 'A modern city-state with futuristic architecture, incredible food scene, and diverse cultural attractions.', 1299.00, 4.7, 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=80', FALSE),

-- More European Destinations
('Venice', 'Italy', 'Europe', 'City', 'Romantic canals, historic architecture, and artistic treasures create a uniquely enchanting atmosphere.', 1199.00, 4.7, 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=600&q=80', FALSE),
('Prague', 'Czech Republic', 'Europe', 'City', 'Medieval architecture, castle views, and affordable charm make Prague a European gem.', 899.00, 4.7, 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=600&q=80', FALSE),
('Norwegian Fjords', 'Norway', 'Europe', 'Nature', 'Dramatic fjords, cascading waterfalls, and charming villages showcase Scandinavia natural beauty.', 1799.00, 4.8, 'https://images.unsplash.com/photo-1519981593452-666cf05569a9?w=600&q=80', FALSE),
('Edinburgh', 'Scotland', 'Europe', 'Cultural', 'Historic castle, cobbled streets, literary heritage, and stunning views define Scotland capital.', 1099.00, 4.6, 'https://images.unsplash.com/photo-1555604171-d6ab3d9fd05f?w=600&q=80', FALSE),
('Croatian Coast', 'Croatia', 'Europe', 'Beach', 'Crystal-clear Adriatic waters, medieval towns, and beautiful islands create a Mediterranean paradise.', 1199.00, 4.7, 'https://images.unsplash.com/photo-1555990277-b146190209ab?w=600&q=80', FALSE),

-- Desert Destinations
('Sahara Desert', 'Morocco', 'Africa', 'Desert', 'Experience golden dunes, camel treks, and star-filled nights in the world largest hot desert.', 1299.00, 4.7, 'https://images.unsplash.com/photo-1509027572446-af8401acfdc3?w=600&q=80', FALSE),
('Dubai Desert', 'UAE', 'Asia', 'Desert', 'Luxury desert camps, dune bashing, and traditional Bedouin experiences near the modern city.', 999.00, 4.6, 'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=600&q=80', FALSE),
('Wadi Rum', 'Jordan', 'Asia', 'Desert', 'Dramatic red sandstone mountains and ancient petroglyphs create a Mars-like landscape.', 1099.00, 4.8, 'https://images.unsplash.com/photo-1583074299344-a4e0a6b15e70?w=600&q=80', FALSE),

-- Additional Popular Destinations
('London', 'UK', 'Europe', 'City', 'Royal palaces, world-class museums, iconic landmarks, and diverse culture define Britain capital.', 1299.00, 4.7, 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80', FALSE),
('Budapest', 'Hungary', 'Europe', 'City', 'Thermal baths, stunning architecture, and the Danube River create an affordable European escape.', 799.00, 4.6, 'https://images.unsplash.com/photo-1541963058-d8fcf84793e7?w=600&q=80', FALSE),
('Petra', 'Jordan', 'Asia', 'Cultural', 'The ancient rose-red city carved into cliffs is one of the New Seven Wonders of the World.', 1499.00, 4.9, 'https://images.unsplash.com/photo-1579606032821-4e6161c81bd3?w=600&q=80', TRUE),
('Amalfi Coast', 'Italy', 'Europe', 'Beach', 'Dramatic cliffs, colorful villages, and Mediterranean charm create an iconic Italian experience.', 1599.00, 4.8, 'https://images.unsplash.com/photo-1534445867742-43195f401b6c?w=600&q=80', FALSE),
('Patagonia', 'Argentina/Chile', 'South America', 'Nature', 'Glaciers, mountains, and pristine wilderness offer epic adventures at the end of the world.', 2199.00, 4.9, 'https://images.unsplash.com/photo-1616277434249-1ea1933be264?w=600&q=80', FALSE),
('Havana', 'Cuba', 'North America', 'Cultural', 'Vintage cars, salsa music, colorful colonial architecture, and rich history create a time capsule experience.', 899.00, 4.6, 'https://images.unsplash.com/photo-1584713503693-bb386ec95cf2?w=600&q=80', FALSE),
('Galápagos Islands', 'Ecuador', 'South America', 'Nature', 'Unique wildlife, volcanic landscapes, and pristine ecosystems inspired Darwin theory of evolution.', 2999.00, 4.9, 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600&q=80', FALSE),
('Vienna', 'Austria', 'Europe', 'Cultural', 'Imperial palaces, classical music heritage, and elegant coffeehouses define this sophisticated city.', 1099.00, 4.7, 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=600&q=80', FALSE),
('Ha Long Bay', 'Vietnam', 'Asia', 'Nature', 'Emerald waters and thousands of limestone islands create a UNESCO World Heritage seascape.', 899.00, 4.8, 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600&q=80', FALSE),
('Yellowstone', 'USA', 'North America', 'Nature', 'Geysers, hot springs, and abundant wildlife in America first national park.', 1099.00, 4.8, 'https://images.unsplash.com/photo-1564415315949-7a0c4c73aab4?w=600&q=80', FALSE),
('Malta', 'Malta', 'Europe', 'Cultural', 'Ancient temples, crystal-clear waters, and Mediterranean charm in a compact island nation.', 999.00, 4.6, 'https://images.unsplash.com/photo-1574435876156-b5574450c48c?w=600&q=80', FALSE);

-- India and Tamil Nadu Destinations
INSERT INTO destinations (name, country, continent, category, description, price_starting, rating, image_url, is_featured) VALUES
('Ooty', 'India', 'Asia', 'Mountain', 'Hill station in Tamil Nadu known for tea gardens and cool climate.', 800.00, 4.7, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&q=80', FALSE),
('Kodaikanal', 'India', 'Asia', 'Mountain', 'Popular hill station with lakes and scenic viewpoints in Tamil Nadu.', 900.00, 4.6, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&q=80', FALSE),
('Mahabalipuram', 'India', 'Asia', 'Cultural', 'UNESCO heritage shore temples and rock-cut architecture on the coast.', 700.00, 4.5, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&q=80', FALSE),
('Rameswaram', 'India', 'Asia', 'Cultural', 'Sacred pilgrimage island with historic temples and sea views.', 600.00, 4.6, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&q=80', FALSE),
('Kanyakumari', 'India', 'Asia', 'Beach', 'Southernmost tip of India with stunning sunrise and sunset views.', 750.00, 4.7, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&q=80', FALSE),
('Munnar', 'India', 'Asia', 'Mountain', 'Tea plantations, misty hills, and wildlife sanctuaries in Kerala.', 1200.00, 4.8, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&q=80', FALSE),
('Goa', 'India', 'Asia', 'Beach', 'Popular beach destination known for nightlife and Portuguese heritage.', 1500.00, 4.7, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&q=80', FALSE),
('Jaipur', 'India', 'Asia', 'Cultural', 'The Pink City with palaces, forts, and vibrant bazaars.', 1100.00, 4.6, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&q=80', FALSE);
