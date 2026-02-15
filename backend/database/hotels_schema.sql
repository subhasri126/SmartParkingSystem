-- Hotels Table
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
);

-- Tourist Spots Table
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
);

-- Sample Hotels Data
INSERT INTO hotels (destination_id, name, price_per_night, rating, image_url, description) VALUES
-- Ooty (ID 1 - assuming)
(1, 'Ooty Grand Hotel', 3500, 4.8, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80', '5-star luxury hotel with mountain views'),
(1, 'Mountain View Resort', 2500, 4.6, 'https://images.unsplash.com/photo-1520763185298-1b434c919abe?w=600&q=80', 'Cozy resort with scenic vistas'),
(1, 'Budget Stay Inn', 1200, 4.2, 'https://images.unsplash.com/photo-1570129477492-45a003537e1f?w=600&q=80', 'Affordable comfortable accommodation');

-- Sample Tourist Spots
INSERT INTO tourist_spots (destination_id, name, description, image_url, category) VALUES
-- Ooty Spots
(1, 'Ooty Lake', 'Beautiful artificial lake with boating facilities', 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&q=80', 'Nature'),
(1, 'Botanical Garden', 'Lush green gardens with rare plant species', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80', 'Nature'),
(1, 'Dodabetta Peak', 'Highest point with panoramic views', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', 'Viewpoint');
