"""
=====================================================
SMART PARKING QR CODE SCANNER
Scans QR codes using laptop webcam and communicates
with Node.js API and ESP32 via serial
=====================================================

Required packages:
    pip install opencv-python pyzbar requests pyserial

Usage:
    python qr_scanner.py
    
Press 'q' to quit
"""

import cv2
from pyzbar.pyzbar import decode
import requests
import serial
import serial.tools.list_ports
import json
import time
from datetime import datetime

# =====================================================
# CONFIGURATION
# =====================================================

# Node.js API configuration
API_BASE_URL = "http://localhost:3000/api"
VERIFY_ENDPOINT = f"{API_BASE_URL}/verify"

# Serial port configuration for ESP32
BAUD_RATE = 115200
ESP32_PORT = None  # Will be auto-detected, or set manually like "COM3" or "/dev/ttyUSB0"

# Scanner settings
CAMERA_INDEX = 0  # 0 for default webcam, 1 for external camera
SCAN_COOLDOWN = 3  # Seconds between scanning same QR code
DISPLAY_WIDTH = 800
DISPLAY_HEIGHT = 600

# =====================================================
# SERIAL PORT FUNCTIONS
# =====================================================

def find_esp32_port():
    """Auto-detect ESP32 serial port"""
    ports = serial.tools.list_ports.comports()
    
    for port in ports:
        # ESP32 usually shows up with these identifiers
        if "CP210" in port.description or "CH340" in port.description or \
           "USB" in port.description or "Serial" in port.description:
            print(f"[INFO] Found potential ESP32 on {port.device}: {port.description}")
            return port.device
    
    print("[WARNING] ESP32 not auto-detected. Using simulation mode.")
    return None


def init_serial_connection():
    """Initialize serial connection to ESP32"""
    global ESP32_PORT
    
    if ESP32_PORT is None:
        ESP32_PORT = find_esp32_port()
    
    if ESP32_PORT is None:
        print("[WARNING] No ESP32 detected. Running in API-only mode.")
        return None
    
    try:
        ser = serial.Serial(ESP32_PORT, BAUD_RATE, timeout=1)
        time.sleep(2)  # Wait for ESP32 to reset after serial connection
        print(f"[SUCCESS] Connected to ESP32 on {ESP32_PORT}")
        return ser
    except serial.SerialException as e:
        print(f"[ERROR] Failed to connect to ESP32: {e}")
        return None


def send_to_esp32(serial_conn, command):
    """Send command to ESP32 via serial"""
    if serial_conn is None:
        print(f"[SIMULATION] Would send to ESP32: {command}")
        return True
    
    try:
        message = f"{command}\n"
        serial_conn.write(message.encode('utf-8'))
        print(f"[SERIAL] Sent to ESP32: {command}")
        
        # Wait for ESP32 response
        time.sleep(0.5)
        if serial_conn.in_waiting > 0:
            response = serial_conn.readline().decode('utf-8').strip()
            print(f"[SERIAL] ESP32 response: {response}")
        
        return True
    except Exception as e:
        print(f"[ERROR] Serial communication failed: {e}")
        return False


# =====================================================
# API FUNCTIONS
# =====================================================

def verify_qr_token(qr_token):
    """
    Verify QR token with Node.js backend API
    
    Args:
        qr_token: UUID token extracted from QR code
        
    Returns:
        tuple: (success: bool, action: str, message: str, data: dict)
    """
    try:
        url = f"{VERIFY_ENDPOINT}/{qr_token}"
        print(f"[API] Verifying token: {qr_token}")
        
        response = requests.get(url, timeout=10)
        result = response.json()
        
        success = result.get('success', False)
        action = result.get('action', 'DENY')
        message = result.get('message', 'Unknown error')
        data = result.get('data', {})
        
        if success:
            print(f"[API] ✅ Verification SUCCESS: {message}")
        else:
            print(f"[API] ❌ Verification FAILED: {message}")
        
        return success, action, message, data
    
    except requests.exceptions.ConnectionError:
        print("[ERROR] Cannot connect to Node.js API. Is the server running?")
        return False, 'DENY', 'API connection failed', {}
    except requests.exceptions.Timeout:
        print("[ERROR] API request timed out")
        return False, 'DENY', 'API timeout', {}
    except json.JSONDecodeError:
        print("[ERROR] Invalid API response")
        return False, 'DENY', 'Invalid API response', {}
    except Exception as e:
        print(f"[ERROR] API error: {e}")
        return False, 'DENY', str(e), {}


def extract_qr_token(qr_data):
    """
    Extract QR token from scanned QR code data
    
    QR code can contain:
    - Just the UUID token (e.g., "550e8400-e29b-41d4-a716-446655440000")
    - JSON with qr_token field
    - URL with token (e.g., ".../verify/550e8400-...")
    
    Args:
        qr_data: Raw string from QR code
        
    Returns:
        str: Extracted QR token or None
    """
    try:
        # Try parsing as JSON first
        data = json.loads(qr_data)
        if 'qr_token' in data:
            return data['qr_token']
        if 'verify_url' in data:
            # Extract token from URL
            return data['verify_url'].split('/')[-1]
    except json.JSONDecodeError:
        pass
    
    # Check if it's a URL
    if '/verify/' in qr_data:
        return qr_data.split('/verify/')[-1]
    
    # Check if it looks like a UUID
    if len(qr_data) == 36 and qr_data.count('-') == 4:
        return qr_data
    
    print(f"[WARNING] Could not extract QR token from: {qr_data[:50]}...")
    return None


# =====================================================
# QR SCANNER CLASS
# =====================================================

class QRScanner:
    """QR Code Scanner with webcam"""
    
    def __init__(self):
        self.cap = None
        self.serial_conn = None
        self.last_scanned = {}  # Track last scan time per QR code
        self.running = False
    
    def initialize(self):
        """Initialize camera and serial connection"""
        # Initialize webcam
        print(f"[INFO] Initializing camera (index: {CAMERA_INDEX})...")
        self.cap = cv2.VideoCapture(CAMERA_INDEX)
        
        if not self.cap.isOpened():
            print("[ERROR] Failed to open camera")
            return False
        
        # Set camera resolution
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, DISPLAY_WIDTH)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, DISPLAY_HEIGHT)
        
        print(f"[SUCCESS] Camera initialized")
        
        # Initialize serial connection
        self.serial_conn = init_serial_connection()
        
        return True
    
    def should_process_qr(self, qr_data):
        """Check if enough time has passed since last scan of this QR"""
        current_time = time.time()
        last_time = self.last_scanned.get(qr_data, 0)
        
        if current_time - last_time < SCAN_COOLDOWN:
            return False
        
        self.last_scanned[qr_data] = current_time
        return True
    
    def process_qr_code(self, qr_data):
        """Process a scanned QR code"""
        print(f"\n{'='*60}")
        print(f"[SCAN] QR Code detected at {datetime.now().strftime('%H:%M:%S')}")
        print(f"{'='*60}")
        
        # Extract token from QR data
        qr_token = extract_qr_token(qr_data)
        
        if qr_token is None:
            print("[ERROR] Invalid QR code format")
            send_to_esp32(self.serial_conn, "DENY")
            return False
        
        print(f"[INFO] Token: {qr_token}")
        
        # Verify with API
        success, action, message, data = verify_qr_token(qr_token)
        
        if success and action == 'OPEN':
            # Send OPEN command to ESP32
            send_to_esp32(self.serial_conn, "OPEN")
            
            # Display booking info
            if data:
                print(f"\n[BOOKING INFO]")
                print(f"  Booking ID: {data.get('booking_id', 'N/A')}")
                print(f"  Slot: {data.get('slot_number', 'N/A')}")
                print(f"  Location: {data.get('location', 'N/A')}")
                print(f"  Valid Until: {data.get('valid_until', 'N/A')}")
            
            return True
        else:
            # Send DENY command to ESP32
            send_to_esp32(self.serial_conn, "DENY")
            print(f"[ACCESS DENIED] {message}")
            return False
    
    def draw_overlay(self, frame, decoded_objects):
        """Draw overlay on frame with QR code detection boxes"""
        for obj in decoded_objects:
            # Draw bounding box
            points = obj.polygon
            if len(points) == 4:
                pts = [(p.x, p.y) for p in points]
                for i in range(4):
                    cv2.line(frame, pts[i], pts[(i+1) % 4], (0, 255, 0), 3)
            
            # Draw data text
            x, y, w, h = obj.rect
            cv2.putText(frame, "QR Detected!", (x, y - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        # Draw status bar
        cv2.rectangle(frame, (0, 0), (DISPLAY_WIDTH, 40), (0, 0, 0), -1)
        cv2.putText(frame, "SMART PARKING QR SCANNER | Press 'Q' to quit",
                   (10, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        return frame
    
    def run(self):
        """Main scanner loop"""
        if not self.initialize():
            return
        
        self.running = True
        print("\n" + "="*60)
        print("SMART PARKING QR SCANNER READY")
        print("="*60)
        print("Hold QR code in front of camera")
        print("Press 'Q' to quit")
        print("="*60 + "\n")
        
        while self.running:
            ret, frame = self.cap.read()
            
            if not ret:
                print("[ERROR] Failed to read from camera")
                break
            
            # Decode QR codes
            decoded_objects = decode(frame)
            
            for obj in decoded_objects:
                qr_data = obj.data.decode('utf-8')
                
                # Process if not recently scanned
                if self.should_process_qr(qr_data):
                    self.process_qr_code(qr_data)
            
            # Draw overlay
            frame = self.draw_overlay(frame, decoded_objects)
            
            # Display frame
            cv2.imshow('Smart Parking QR Scanner', frame)
            
            # Check for quit key
            if cv2.waitKey(1) & 0xFF == ord('q'):
                print("\n[INFO] Quitting scanner...")
                self.running = False
        
        self.cleanup()
    
    def cleanup(self):
        """Clean up resources"""
        if self.cap is not None:
            self.cap.release()
        
        if self.serial_conn is not None:
            self.serial_conn.close()
        
        cv2.destroyAllWindows()
        print("[INFO] Scanner stopped")


# =====================================================
# MAIN ENTRY POINT
# =====================================================

if __name__ == "__main__":
    print("""
    ╔═══════════════════════════════════════════════════════════╗
    ║          VOYAGO SMART PARKING QR SCANNER                  ║
    ║                                                           ║
    ║  Requirements:                                            ║
    ║  - Node.js backend running on localhost:3000              ║
    ║  - ESP32 connected via USB (optional)                     ║
    ║  - Webcam connected                                       ║
    ╚═══════════════════════════════════════════════════════════╝
    """)
    
    scanner = QRScanner()
    
    try:
        scanner.run()
    except KeyboardInterrupt:
        print("\n[INFO] Interrupted by user")
        scanner.cleanup()
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        scanner.cleanup()
