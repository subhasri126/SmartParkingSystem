-- =====================================================
-- QR VERIFICATION SCHEMA
-- Extended parking_bookings table with QR token support
-- =====================================================

-- Add qr_token column to parking_bookings table if not exists
ALTER TABLE parking_bookings 
ADD COLUMN IF NOT EXISTS qr_token VARCHAR(36) UNIQUE AFTER qr_code_url,
ADD COLUMN IF NOT EXISTS qr_verified BOOLEAN DEFAULT FALSE AFTER qr_token,
ADD COLUMN IF NOT EXISTS qr_verified_at DATETIME NULL AFTER qr_verified,
ADD COLUMN IF NOT EXISTS entry_time DATETIME NULL AFTER qr_verified_at,
ADD COLUMN IF NOT EXISTS exit_time DATETIME NULL AFTER entry_time,
ADD INDEX idx_qr_token (qr_token);

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
    pb.status,
    pl.name as location_name,
    pl.city,
    u.name as user_name
FROM parking_bookings pb
JOIN parking_locations pl ON pb.location_id = pl.id
JOIN users u ON pb.user_id = u.id
WHERE pb.status = 'active';
