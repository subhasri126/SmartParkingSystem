# Voyago Authentication - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Files Added
Your project now has 4 new files:
```
Tourist_guide/
├── auth.html              ← Main authentication page
├── auth-styles.css        ← Styling (glassmorphism)
├── auth-script.js         ← JavaScript logic
└── AUTH_DOCUMENTATION.md  ← Full documentation
```

### Step 2: Access the Auth Page
Simply open the auth page in your browser:
```
http://localhost/auth.html
```

Or add links from your homepage (already updated in index.html):
```html
<a href="auth.html">Login</a>
<a href="auth.html">Register</a>
```

### Step 3: Test the System

#### Test Registration
1. Click "Register" tab
2. Fill in:
   - Full Name: Any name
   - Email: any@email.com
   - Password: MyPassword123 (must include uppercase, lowercase, number)
   - Confirm Password: MyPassword123
3. Check "I agree to terms"
4. Click "Create Account"
5. Enter OTP code: `123456` (for testing)
6. See success message

#### Test Login
1. Click "Login" tab
2. Enter any email
3. Enter any password
4. Click "Sign In"
5. Enter OTP: `123456`
6. See success message

---

## ⚙️ Integration with Backend

### Option 1: Node.js/Express Backend

```javascript
// server.js
const express = require('express');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const redis = require('redis');

const app = express();
app.use(express.json());

// Email setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-app-password'
    }
});

// Redis setup for OTP storage
const client = redis.createClient();

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user (unverified)
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            verified: false
        });
        await newUser.save();

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await client.setex(`otp:${email}`, 300, otp); // 5 minutes

        // Send email
        await transporter.sendMail({
            to: email,
            subject: 'Voyago - Verify Your Email',
            html: `<h1>Welcome to Voyago!</h1>
                   <p>Your verification code is: <strong>${otp}</strong></p>
                   <p>This code expires in 5 minutes.</p>`
        });

        res.json({ success: true, message: 'Registration successful. Check your email.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verify OTP endpoint
app.post('/api/auth/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    try {
        const storedOtp = await client.get(`otp:${email}`);
        
        if (!storedOtp || storedOtp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // Mark user as verified
        await User.findOneAndUpdate({ email }, { verified: true });
        await client.del(`otp:${email}`);

        // Create session token
        const token = jwt.sign({ email }, 'secret_key', { expiresIn: '7d' });

        res.json({ 
            success: true, 
            message: 'Email verified!',
            token,
            user: { email }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(400).json({ error: 'Email not registered' });
        }

        if (!user.verified) {
            // Send OTP for verification
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            await client.setex(`otp:${email}`, 300, otp);
            
            await transporter.sendMail({
                to: email,
                subject: 'Voyago - Verify Your Email',
                html: `<p>Verification code: <strong>${otp}</strong></p>`
            });

            return res.json({ 
                success: false, 
                needsVerification: true,
                message: 'Please verify your email first'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        const token = jwt.sign({ userId: user._id, email }, 'secret_key', { expiresIn: '7d' });

        res.json({ 
            success: true, 
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

### Step 2: Update JavaScript to Use Real API

In `auth-script.js`, replace the simulated API calls:

```javascript
// OLD: Simulated API call
await simulateApiDelay(1500);

// NEW: Real API call
const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
});

const data = await response.json();

if (!response.ok) {
    throw new Error(data.error);
}
```

---

## 📧 Email Service Integration

### Using SendGrid
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
    to: email,
    from: 'noreply@voyago.com',
    subject: 'Voyago - Email Verification',
    html: `
        <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to Voyago!</h2>
            <p>Your verification code is:</p>
            <h1 style="color: #4A90E2; letter-spacing: 5px;">${otp}</h1>
            <p>This code expires in 5 minutes.</p>
        </div>
    `
};

await sgMail.send(msg);
```

### Using AWS SES
```javascript
const AWS = require('aws-sdk');
const ses = new AWS.SES();

const params = {
    Destination: { ToAddresses: [email] },
    Message: {
        Body: { Html: { Data: htmlTemplate } },
        Subject: { Data: 'Voyago - Email Verification' }
    },
    Source: 'noreply@voyago.com'
};

await ses.sendEmail(params).promise();
```

---

## 🔒 Password Hashing

Replace simple hash with bcrypt:

```javascript
// auth-script.js
async function handleRegister(e) {
    // ... validation code ...

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                email,
                password // Send plain password - backend will hash it
            })
        });

        // Backend handles hashing with bcrypt
    } catch (error) {
        // Handle error
    }
}
```

---

## 📱 Mobile Optimization

All styles are already responsive! Test on:
- iPhone (375px)
- iPad (768px)
- Desktop (1024px+)

---

## 🎨 Customization Examples

### Change Colors to Match Your Brand
```css
/* In auth-styles.css */
:root {
    --primary-color: #YOUR_COLOR;
    --secondary-color: #YOUR_SECONDARY;
}
```

### Change Blur Effect Strength
```css
.auth-card {
    backdrop-filter: blur(50px); /* Increase from 30px */
}
```

### Adjust Form Width
```css
.auth-card {
    max-width: 500px; /* Increase from 420px */
}
```

---

## 🧪 Testing Checklist

- [ ] Test registration with valid email
- [ ] Test password strength validation
- [ ] Test OTP input with paste
- [ ] Test OTP with wrong code
- [ ] Test login with registered email
- [ ] Test login with unregistered email
- [ ] Test remember me checkbox
- [ ] Test on mobile devices
- [ ] Test on different browsers
- [ ] Test keyboard navigation
- [ ] Test form error messages

---

## 🚨 Common Issues & Fixes

### Issue: OTP Modal Not Closing
**Solution**: Check that modal has `show` class
```javascript
elements.otpModal.classList.add('show');
```

### Issue: Password Strength Not Showing
**Solution**: Ensure `registerPassword` input exists
```html
<input type="password" id="registerPassword" ...>
```

### Issue: Validation Messages Not Showing
**Solution**: Check error elements exist
```html
<span class="error-message"></span>
```

### Issue: Buttons Disabled After Error
**Solution**: Clear disabled state before showing errors
```javascript
setButtonLoading(submitBtn, false);
```

---

## 📊 Performance Tips

1. **Lazy load email service** - Only initialize when needed
2. **Cache OTP expiry** - Use Redis for fast lookups
3. **Minify CSS/JS** - Reduce file sizes
4. **Use CDN** - Serve static files from CDN
5. **Add caching headers** - Speed up repeat visits

---

## 🔐 Security Checklist

- [ ] Use HTTPS only
- [ ] Validate all inputs on backend
- [ ] Implement rate limiting
- [ ] Use secure HTTP-only cookies
- [ ] Add CSRF tokens
- [ ] Log authentication attempts
- [ ] Monitor failed login attempts
- [ ] Use strong password requirements
- [ ] Implement email verification
- [ ] Use JWT with expiration

---

## 📞 Deployment

### Deploy to Vercel
```bash
vercel
```

### Deploy to Netlify
```bash
netlify deploy
```

### Deploy to Heroku
```bash
git push heroku main
```

---

## 🆘 Support Resources

- **MDN Web Docs**: https://developer.mozilla.org
- **OWASP**: https://owasp.org (Security best practices)
- **Nodemailer**: https://nodemailer.com
- **Bcrypt**: https://www.npmjs.com/package/bcrypt
- **JWT**: https://jwt.io

---

**Next Steps**:
1. Set up backend API
2. Connect email service
3. Implement database
4. Add rate limiting
5. Deploy to production

**Version**: 1.0  
**Created**: February 14, 2026
