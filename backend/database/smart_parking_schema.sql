-- =====================================================
-- SMART PARKING DATABASE SCHEMA (Extended)
-- Tables for Location-based Parking System with Bookings
-- =====================================================

-- Create parking_locations table
CREATE TABLE IF NOT EXISTS parking_locations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    total_slots INT NOT NULL DEFAULT 20,
    available_slots INT NOT NULL DEFAULT 20,
    address TEXT,
    price_per_hour DECIMAL(10, 2) DEFAULT 20.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_city (city),
    INDEX idx_state (state),
    INDEX idx_lat_lng (latitude, longitude)
);

-- Update parking_slots table to include location reference
ALTER TABLE parking_slots 
ADD COLUMN IF NOT EXISTS location_id INT NULL AFTER id,
ADD INDEX idx_location_id (location_id);

-- Create new parking_slots_v2 table with location support
CREATE TABLE IF NOT EXISTS parking_slots_v2 (
    id INT PRIMARY KEY AUTO_INCREMENT,
    location_id INT NOT NULL,
    slot_number VARCHAR(20) NOT NULL,
    status ENUM('available', 'occupied', 'reserved') DEFAULT 'available',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_location_id (location_id),
    INDEX idx_status (status),
    UNIQUE KEY unique_location_slot (location_id, slot_number),
    FOREIGN KEY (location_id) REFERENCES parking_locations(id) ON DELETE CASCADE
);

-- Create parking_bookings table
CREATE TABLE IF NOT EXISTS parking_bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    location_id INT NOT NULL,
    slot_id INT NOT NULL,
    slot_number VARCHAR(20) NOT NULL,
    booking_id VARCHAR(50) NOT NULL UNIQUE,
    booking_start_time DATETIME NOT NULL,
    booking_end_time DATETIME NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    qr_code_url TEXT,
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_location_id (location_id),
    INDEX idx_booking_id (booking_id),
    INDEX idx_status (status),
    INDEX idx_booking_time (booking_start_time, booking_end_time),
    FOREIGN KEY (location_id) REFERENCES parking_locations(id) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES parking_slots_v2(id) ON DELETE CASCADE
);
