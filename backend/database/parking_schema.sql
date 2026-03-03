-- =====================================================
-- SMART PARKING DATABASE SCHEMA
-- Tables for IoT Smart Parking System
-- =====================================================

-- Create parking_slots table
CREATE TABLE IF NOT EXISTS parking_slots (
    id INT PRIMARY KEY AUTO_INCREMENT,
    slot_number INT NOT NULL UNIQUE,
    status ENUM('available', 'occupied', 'reserved') DEFAULT 'available',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_slot_number (slot_number)
);

-- Create parking_logs table for tracking all status changes
CREATE TABLE IF NOT EXISTS parking_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    slot_id INT NOT NULL,
    status ENUM('available', 'occupied', 'reserved') NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_slot_id (slot_id),
    INDEX idx_changed_at (changed_at),
    INDEX idx_status (status),
    FOREIGN KEY (slot_id) REFERENCES parking_slots(id) ON DELETE CASCADE
);

-- Insert initial parking slots (20 slots)
INSERT INTO parking_slots (slot_number, status) VALUES
(1, 'available'),
(2, 'available'),
(3, 'occupied'),
(4, 'available'),
(5, 'reserved'),
(6, 'available'),
(7, 'occupied'),
(8, 'available'),
(9, 'available'),
(10, 'occupied'),
(11, 'available'),
(12, 'available'),
(13, 'occupied'),
(14, 'available'),
(15, 'available'),
(16, 'reserved'),
(17, 'available'),
(18, 'occupied'),
(19, 'available'),
(20, 'available')
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- Insert some sample parking logs for analytics
INSERT INTO parking_logs (slot_id, status, changed_at) VALUES
(1, 'occupied', NOW() - INTERVAL 2 DAY),
(1, 'available', NOW() - INTERVAL 2 DAY + INTERVAL 2 HOUR),
(2, 'occupied', NOW() - INTERVAL 1 DAY),
(2, 'available', NOW() - INTERVAL 1 DAY + INTERVAL 3 HOUR),
(3, 'occupied', NOW() - INTERVAL 12 HOUR),
(4, 'reserved', NOW() - INTERVAL 6 HOUR),
(4, 'occupied', NOW() - INTERVAL 5 HOUR),
(4, 'available', NOW() - INTERVAL 4 HOUR),
(5, 'reserved', NOW() - INTERVAL 3 HOUR),
(6, 'occupied', NOW() - INTERVAL 2 HOUR),
(6, 'available', NOW() - INTERVAL 1 HOUR),
(7, 'occupied', NOW() - INTERVAL 30 MINUTE),
(10, 'occupied', NOW() - INTERVAL 20 MINUTE);
