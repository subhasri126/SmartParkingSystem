-- =====================================================
-- QR VERIFICATION SCHEMA
-- Extended parking_bookings table with QR token support
-- =====================================================

-- Create parking_bookings table if it doesn't exist
CREATE TABLE IF NOT EXISTS parking_bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    location_id INT,
    slot_number INT,
    booking_id VARCHAR(50),
    booking_start_time DATETIME,
    booking_end_time DATETIME,
    qr_code_url VARCHAR(500),
    qr_token VARCHAR(36) UNIQUE,
    qr_verified BOOLEAN DEFAULT FALSE,
    qr_verified_at DATETIME NULL,
    entry_time DATETIME NULL,
    exit_time DATETIME NULL,
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_location_id (location_id),
    INDEX idx_qr_token (qr_token)
);

-- Create parking_access_logs table for gate entry/exit logging
CREATE TABLE IF NOT EXISTS parking_access_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    qr_token VARCHAR(36) NOT NULL,
    action ENUM('entry', 'exit') NOT NULL,
    gate_id VARCHAR(50) DEFAULT 'GATE-01',
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_booking_id (booking_id),
    INDEX idx_qr_token (qr_token),
    INDEX idx_action (action),
    FOREIGN KEY (booking_id) REFERENCES parking_bookings(id) ON DELETE CASCADE
);

-- View for active bookings with QR verification status
CREATE OR REPLACE VIEW active_bookings_view AS
SELECT 
    pb.id,
    pb.booking_id,
    pb.qr_token,
    pb.slot_number,
    pb.booking_start_time,
    pb.booking_end_time,
    pb.qr_verified,
    pb.status
FROM parking_bookings pb
WHERE pb.status = 'active';
