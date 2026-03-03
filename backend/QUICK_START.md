# Quick Setup Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Node.js
Download and install Node.js from https://nodejs.org/ (v18 or higher)

### Step 2: Install MySQL
Download and install MySQL from https://dev.mysql.com/downloads/mysql/

### Step 3: Clone and Setup

```bash
cd backend
npm install
```

### Step 4: Configure Database

1. Open MySQL Workbench or MySQL CLI
2. Run this command:

```sql
CREATE DATABASE voyago_db;
USE voyago_db;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    otp_code VARCHAR(6) DEFAULT NULL,
    otp_expiry DATETIME DEFAULT NULL,
    last_otp_sent DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Step 5: Setup Gmail for Email

1. Go to Google Account Settings
2. Enable 2-Step Verification
3. Generate App Password at: https://myaccount.google.com/apppasswords
4. Save the 16-character password

### Step 6: Configure Environment

Create `.env` file:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=voyago_db
DB_PORT=3306

JWT_SECRET=mySecretKey12345!@#$%
JWT_EXPIRE=7d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_16_char_app_password
EMAIL_FROM=Voyago <noreply@voyago.com>

OTP_EXPIRY_MINUTES=5
RESEND_OTP_COOLDOWN_SECONDS=30

FRONTEND_URL=http://localhost:8080
```

### Step 7: Start Server

```bash
npm run dev
```

You should see:
```
✅ MySQL Database Connected Successfully
✅ Email Service Ready
🚀 Server running in development mode
🌐 URL: http://localhost:5000
```

### Step 8: Test with Postman

**Register User:**
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "full_name": "Test User",
  "email": "test@example.com",
  "password": "Test1234"
}
```

**Check your email for OTP**

**Verify OTP:**
```
POST http://localhost:5000/api/auth/verify-otp
Content-Type: application/json

{
  "email": "test@example.com",
  "otp": "123456"
}
```

**Login:**
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test1234"
}
```

Copy the token from response.

**Get Profile:**
```
GET http://localhost:5000/api/auth/me
Authorization: Bearer <paste_your_token_here>
```

## ✅ Success!

You now have a working authentication backend!

## 🔥 Common Issues

### MySQL Connection Failed
- Check if MySQL is running: `sudo service mysql start` (Linux) or start MySQL from Services (Windows)
- Verify credentials in `.env` file

### Email Not Sending
- Make sure you're using Gmail App Password, not regular password
- Check if 2-Step Verification is enabled

### Port Already in Use
- Change PORT in `.env` to another port like 5001

## 📞 Need Help?

Check the detailed README.md for more information.
