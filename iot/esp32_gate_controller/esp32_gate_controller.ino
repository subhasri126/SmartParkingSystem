/*
 * =====================================================
 * VOYAGO SMART PARKING GATE CONTROLLER
 * ESP32 with Servo Motor and Buzzer
 * =====================================================
 * 
 * Hardware Connections:
 *   - Servo Motor: GPIO 13 (or any PWM pin)
 *   - Buzzer: GPIO 12
 *   - USB Serial: For communication with Python scanner
 * 
 * Commands received via Serial:
 *   - "OPEN"  : Opens gate, buzzer beeps, auto-close after 3s
 *   - "DENY"  : Buzzer error sound, gate stays closed
 *   - "STATUS": Returns current gate status
 *   - "TEST"  : Test servo and buzzer
 * 
 * Install ESP32Servo library:
 *   Arduino IDE -> Sketch -> Include Library -> Manage Libraries
 *   Search for "ESP32Servo" and install
 * 
 * Board Selection:
 *   Tools -> Board -> ESP32 Arduino -> ESP32 Dev Module
 * 
 * =====================================================
 */

#include <ESP32Servo.h>

// =====================================================
// PIN CONFIGURATION
// =====================================================

#define SERVO_PIN     13    // Servo motor signal pin
#define BUZZER_PIN    12    // Buzzer pin
#define LED_PIN       2     // Built-in LED (optional indicator)

// =====================================================
// SERVO CONFIGURATION
// =====================================================

#define SERVO_CLOSED  0     // Servo angle when gate is closed
#define SERVO_OPEN    90    // Servo angle when gate is open
#define GATE_OPEN_TIME 3000 // Time to keep gate open (milliseconds)

// =====================================================
// BUZZER TONES (Hz)
// =====================================================

#define BEEP_SUCCESS  2000  // Success beep frequency
#define BEEP_ERROR    500   // Error beep frequency
#define BEEP_DURATION 100   // Single beep duration (ms)

// =====================================================
// GLOBAL VARIABLES
// =====================================================

Servo gateServo;
bool gateIsOpen = false;
unsigned long gateOpenTime = 0;
String inputString = "";
bool stringComplete = false;

// =====================================================
// SETUP FUNCTION
// =====================================================

void setup() {
    // Initialize Serial communication
    Serial.begin(115200);
    while (!Serial) {
        delay(10);
    }
    
    // Initialize pins
    pinMode(BUZZER_PIN, OUTPUT);
    pinMode(LED_PIN, OUTPUT);
    
    // Initialize servo
    ESP32PWM::allocateTimer(0);
    ESP32PWM::allocateTimer(1);
    ESP32PWM::allocateTimer(2);
    ESP32PWM::allocateTimer(3);
    
    gateServo.setPeriodHertz(50);  // Standard 50hz servo
    gateServo.attach(SERVO_PIN, 500, 2400);
    
    // Close gate on startup
    closeGate();
    
    // Startup beep
    beepSuccess();
    
    // Print startup message
    Serial.println();
    Serial.println("===================================");
    Serial.println("VOYAGO SMART PARKING GATE READY");
    Serial.println("===================================");
    Serial.println("Commands: OPEN, DENY, STATUS, TEST");
    Serial.println("===================================");
    Serial.println();
    
    // Blink LED to indicate ready
    for (int i = 0; i < 3; i++) {
        digitalWrite(LED_PIN, HIGH);
        delay(100);
        digitalWrite(LED_PIN, LOW);
        delay(100);
    }
}

// =====================================================
// MAIN LOOP
// =====================================================

void loop() {
    // Check for serial input
    serialEvent();
    
    // Process complete command
    if (stringComplete) {
        processCommand(inputString);
        inputString = "";
        stringComplete = false;
    }
    
    // Auto-close gate after timeout
    if (gateIsOpen && (millis() - gateOpenTime >= GATE_OPEN_TIME)) {
        Serial.println("[GATE] Auto-closing gate...");
        closeGate();
    }
}

// =====================================================
// SERIAL EVENT HANDLER
// =====================================================

void serialEvent() {
    while (Serial.available()) {
        char inChar = (char)Serial.read();
        
        if (inChar == '\n' || inChar == '\r') {
            if (inputString.length() > 0) {
                stringComplete = true;
            }
        } else {
            inputString += inChar;
        }
    }
}

// =====================================================
// COMMAND PROCESSOR
// =====================================================

void processCommand(String command) {
    // Trim whitespace and convert to uppercase
    command.trim();
    command.toUpperCase();
    
    Serial.print("[CMD] Received: ");
    Serial.println(command);
    
    if (command == "OPEN") {
        handleOpenCommand();
    } 
    else if (command == "DENY") {
        handleDenyCommand();
    } 
    else if (command == "STATUS") {
        handleStatusCommand();
    } 
    else if (command == "TEST") {
        handleTestCommand();
    }
    else if (command == "CLOSE") {
        closeGate();
        Serial.println("[GATE] Gate closed manually");
    }
    else {
        Serial.print("[ERROR] Unknown command: ");
        Serial.println(command);
    }
}

// =====================================================
// COMMAND HANDLERS
// =====================================================

void handleOpenCommand() {
    Serial.println("[GATE] Opening gate...");
    
    // Turn on LED indicator
    digitalWrite(LED_PIN, HIGH);
    
    // Success beep
    beepSuccess();
    
    // Open gate
    openGate();
    
    // Record open time for auto-close
    gateOpenTime = millis();
    
    Serial.println("[GATE] Gate OPEN - Will auto-close in 3 seconds");
    Serial.println("ACK:OPEN");
}

void handleDenyCommand() {
    Serial.println("[GATE] Access DENIED");
    
    // Error beep pattern (3 short beeps)
    beepError();
    delay(100);
    beepError();
    delay(100);
    beepError();
    
    // Flash LED rapidly
    for (int i = 0; i < 5; i++) {
        digitalWrite(LED_PIN, HIGH);
        delay(50);
        digitalWrite(LED_PIN, LOW);
        delay(50);
    }
    
    Serial.println("ACK:DENY");
}

void handleStatusCommand() {
    Serial.println("===== GATE STATUS =====");
    Serial.print("Gate Position: ");
    Serial.println(gateIsOpen ? "OPEN" : "CLOSED");
    Serial.print("Current Angle: ");
    Serial.println(gateIsOpen ? SERVO_OPEN : SERVO_CLOSED);
    Serial.print("Uptime (ms): ");
    Serial.println(millis());
    Serial.println("=======================");
    Serial.println("ACK:STATUS");
}

void handleTestCommand() {
    Serial.println("[TEST] Starting hardware test...");
    
    // Test buzzer
    Serial.println("[TEST] Testing buzzer...");
    beepSuccess();
    delay(300);
    beepError();
    delay(300);
    
    // Test servo
    Serial.println("[TEST] Testing servo - Opening...");
    openGate();
    delay(1500);
    
    Serial.println("[TEST] Testing servo - Closing...");
    closeGate();
    delay(500);
    
    // Test LED
    Serial.println("[TEST] Testing LED...");
    for (int i = 0; i < 3; i++) {
        digitalWrite(LED_PIN, HIGH);
        delay(200);
        digitalWrite(LED_PIN, LOW);
        delay(200);
    }
    
    Serial.println("[TEST] Hardware test complete!");
    Serial.println("ACK:TEST");
}

// =====================================================
// GATE CONTROL FUNCTIONS
// =====================================================

void openGate() {
    gateServo.write(SERVO_OPEN);
    gateIsOpen = true;
    digitalWrite(LED_PIN, HIGH);
}

void closeGate() {
    gateServo.write(SERVO_CLOSED);
    gateIsOpen = false;
    digitalWrite(LED_PIN, LOW);
}

// =====================================================
// BUZZER FUNCTIONS
// =====================================================

void beepSuccess() {
    // Single high-pitched beep for success
    tone(BUZZER_PIN, BEEP_SUCCESS, 500);
    delay(500);
    noTone(BUZZER_PIN);
}

void beepError() {
    // Lower-pitched beep for errors
    tone(BUZZER_PIN, BEEP_ERROR, BEEP_DURATION);
    delay(BEEP_DURATION);
    noTone(BUZZER_PIN);
}

void beepPattern(int count, int frequency, int duration) {
    for (int i = 0; i < count; i++) {
        tone(BUZZER_PIN, frequency, duration);
        delay(duration + 50);
    }
    noTone(BUZZER_PIN);
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

void blinkLED(int count, int delayMs) {
    for (int i = 0; i < count; i++) {
        digitalWrite(LED_PIN, HIGH);
        delay(delayMs);
        digitalWrite(LED_PIN, LOW);
        delay(delayMs);
    }
}
