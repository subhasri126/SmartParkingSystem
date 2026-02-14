# Voyago Authentication Backend

Complete production-ready authentication system for the Voyago travel website built with Node.js, Express.js, MySQL, and JWT.

## 🚀 Features

- ✅ **User Registration** with email verification
- ✅ **OTP Verification** via email (5-minute expiry)
- ✅ **JWT Authentication** for secure sessions
- ✅ **Password Hashing** using bcrypt
- ✅ **Email Service** using Nodemailer
- ✅ **Rate Limiting** to prevent abuse
- ✅ **Input Validation** with express-validator
- ✅ **Error Handling** middleware
- ✅ **Security Headers** with Helmet
- ✅ **CORS** configuration
- ✅ **Resend OTP** with cooldown (30 seconds)

## 📋 Tech Stack

- **Backend**: Node.js v18+
- **Framework**: Express.js
- **Database**: MySQL 8.0+
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Email Service**: Nodemailer
- **Validation**: express-validator
- **Security**: helmet, cors, express-rate-limit

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # MySQL connection pool
├── controllers/
│   └── authController.js    # Authentication logic
├── database/
│   └── schema.sql           # Database schema
├── middleware/
│   ├── authMiddleware.js    # JWT authentication
│   ├── errorHandler.js      # Error handling
│   └── validation.js        # Input validation
├── models/
│   └── User.js              # User model
├── routes/
│   └── authRoutes.js        # API routes
├── utils/
│   └── emailService.js      # Email sending
├── .env.example             # Environment variables template
├── .gitignore
├── package.json
├── server.js                # Main entry point
└── README.md
```

## 🛠️ Installation & Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Update the `.env` file with your credentials:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=voyago_db
DB_PORT=3306

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=Voyago <noreply@voyago.com>

# OTP
OTP_EXPIRY_MINUTES=5
RESEND_OTP_COOLDOWN_SECONDS=30

# Frontend
FRONTEND_URL=http://localhost:8080
```

### 3. Setup MySQL Database

**Option A: Using MySQL Workbench or phpMyAdmin**
- Open the `database/schema.sql` file
- Execute the SQL commands

**Option B: Using MySQL CLI**

```bash
mysql -u root -p < database/schema.sql
```

Or manually:

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

### 4. Gmail Setup (for Email Service)

1. Enable 2-Step Verification in your Google account
2. Generate an App Password:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password
   - Use this in `EMAIL_PASSWORD` in `.env`

### 5. Start the Server

**Development mode with auto-reload:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start at `http://localhost:5000`

## 📡 API Endpoints

### 1. Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "Secret123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful! OTP sent to your email.",
  "email": "john@example.com",
  "userId": 1
}
```

### 2. Verify OTP

```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully! Welcome to Voyago.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "is_verified": true
  }
}
```

### 3. Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Secret123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "is_verified": true
  }
}
```

### 4. Resend OTP

```http
POST /api/auth/resend-otp
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "New OTP sent to your email.",
  "email": "john@example.com"
}
```

### 5. Get User Profile (Protected)

```http
GET /api/auth/me
Authorization: Bearer <your_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "is_verified": true,
    "created_at": "2026-02-14T10:30:00.000Z"
  }
}
```

## 🔒 Security Features

1. **Password Hashing**: Passwords are hashed using bcrypt with salt rounds
2. **JWT Authentication**: Secure token-based authentication
3. **Rate Limiting**: Prevents brute force attacks
4. **Input Validation**: Validates all user inputs
5. **CORS Protection**: Configured for specific frontend URL
6. **Security Headers**: Using Helmet.js
7. **Environment Variables**: Sensitive data stored in .env
8. **OTP Expiry**: OTPs expire after 5 minutes
9. **Resend Cooldown**: 30-second cooldown between OTP requests

## 🧪 Testing with Postman/Thunder Client

1. **Register**: POST `http://localhost:5000/api/auth/register`
2. **Check Email**: Look for OTP code (6 digits)
3. **Verify OTP**: POST `http://localhost:5000/api/auth/verify-otp`
4. **Login**: POST `http://localhost:5000/api/auth/login`
5. **Get Profile**: GET `http://localhost:5000/api/auth/me` with Bearer token

## 🐛 Common Issues & Solutions

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution**: Make sure MySQL is running and credentials in `.env` are correct

### Email Not Sending
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```
**Solution**: Use Gmail App Password instead of regular password

### JWT Token Invalid
```
Error: Invalid token. Authorization failed.
```
**Solution**: Make sure to include `Bearer <token>` in Authorization header

## 📝 Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | `your_password` |
| `DB_NAME` | Database name | `voyago_db` |
| `JWT_SECRET` | Secret key for JWT | `random_secret_key` |
| `EMAIL_USER` | Gmail address | `your@gmail.com` |
| `EMAIL_PASSWORD` | Gmail app password | `16-char-code` |

## 🚀 Deployment

### Production Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Set `NODE_ENV=production`
- [ ] Use strong database passwords
- [ ] Configure production database
- [ ] Set up proper CORS for your domain
- [ ] Enable SSL/TLS
- [ ] Set up monitoring and logging
- [ ] Configure firewall rules
- [ ] Use PM2 for process management

### Using PM2 (Recommended)

```bash
npm install -g pm2
pm2 start server.js --name voyago-auth
pm2 save
pm2 startup
```

## 📄 License

MIT License - feel free to use this for your projects!

## 👨‍💻 Author

Voyago Team - 2026

---

**🌍 Happy Coding! Build amazing travel experiences with Voyago!**
