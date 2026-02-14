# Frontend Integration Guide

## 🔗 Connecting Voyago Frontend to Backend

This guide shows how to integrate the authentication backend with your existing auth.html page.

## 📝 Update auth-script.js

Replace the API configuration in your `auth-script.js`:

```javascript
// ==================== CONFIG ====================
const AUTH_CONFIG = {
    API_BASE_URL: 'http://localhost:5000/api/auth', // Backend URL
    OTP_DURATION: 300, // 5 minutes
    RESEND_COOLDOWN: 30, // 30 seconds
    MIN_PASSWORD_LENGTH: 8,
};
```

## 🔧 API Integration Functions

Add these functions to `auth-script.js`:

### 1. Register User

```javascript
async function handleRegister(e) {
    e.preventDefault();
    
    const full_name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ full_name, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            authState.otpEmail = email;
            showOtpModal(email);
            showMessage('success', data.message);
        } else {
            showMessage('error', data.message);
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('error', 'Network error. Please try again.');
    }
}
```

### 2. Verify OTP

```javascript
async function handleOtpVerification(e) {
    e.preventDefault();
    
    const otpInputs = document.querySelectorAll('.otp-input');
    const otp = Array.from(otpInputs).map(input => input.value).join('');
    
    try {
        const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: authState.otpEmail,
                otp: otp
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store JWT token
            localStorage.setItem('voyago_token', data.token);
            localStorage.setItem('voyago_user', JSON.stringify(data.user));
            
            closeOtpModal();
            showSuccessModal();
            
            // Redirect to home page after 2 seconds
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            showMessage('error', data.message);
        }
    } catch (error) {
        console.error('OTP verification error:', error);
        showMessage('error', 'Network error. Please try again.');
    }
}
```

### 3. Login User

```javascript
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store JWT token
            localStorage.setItem('voyago_token', data.token);
            localStorage.setItem('voyago_user', JSON.stringify(data.user));
            
            showMessage('success', 'Login successful! Redirecting...');
            
            // Redirect to home page
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            if (data.requires_verification) {
                // Show OTP modal if email not verified
                authState.otpEmail = email;
                showOtpModal(email);
            }
            showMessage('error', data.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('error', 'Network error. Please try again.');
    }
}
```

### 4. Resend OTP

```javascript
async function handleResendOtp() {
    try {
        const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/resend-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: authState.otpEmail })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('success', data.message);
            startResendTimer();
        } else {
            showMessage('error', data.message);
        }
    } catch (error) {
        console.error('Resend OTP error:', error);
        showMessage('error', 'Network error. Please try again.');
    }
}
```

### 5. Get User Profile (Protected Route)

```javascript
async function getUserProfile() {
    const token = localStorage.getItem('voyago_token');
    
    if (!token) {
        window.location.href = 'auth.html';
        return;
    }
    
    try {
        const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            return data.user;
        } else {
            // Token invalid, redirect to login
            localStorage.removeItem('voyago_token');
            localStorage.removeItem('voyago_user');
            window.location.href = 'auth.html';
        }
    } catch (error) {
        console.error('Get profile error:', error);
    }
}
```

## 🔐 Authentication Helper Functions

Add these to your frontend:

```javascript
// Check if user is logged in
function isAuthenticated() {
    return localStorage.getItem('voyago_token') !== null;
}

// Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('voyago_user');
    return userStr ? JSON.parse(userStr) : null;
}

// Logout user
function logout() {
    localStorage.removeItem('voyago_token');
    localStorage.removeItem('voyago_user');
    window.location.href = 'auth.html';
}

// Show message helper
function showMessage(type, message) {
    // Your existing message display logic
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(el => {
        el.textContent = message;
        el.style.color = type === 'error' ? 'red' : 'green';
    });
}
```

## 🔄 Update index.html

Add user greeting in your navbar:

```javascript
// Add to your index.html script
document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    
    if (user) {
        // Update navbar to show user name and logout button
        const navMenu = document.querySelector('.nav-menu');
        const loginBtn = document.querySelector('.btn-login');
        const registerBtn = document.querySelector('.btn-register');
        
        if (loginBtn && registerBtn) {
            loginBtn.outerHTML = `<li><span class="nav-link">Hello, ${user.full_name}</span></li>`;
            registerBtn.outerHTML = `<li><a href="#" class="nav-link" onclick="logout()">Logout</a></li>`;
        }
    }
});
```

## 🚀 CORS Configuration

Make sure your backend `.env` has:

```env
FRONTEND_URL=http://localhost:8080
```

## 🧪 Testing Complete Flow

1. **Start Backend**: `npm run dev` in backend folder
2. **Start Frontend**: Open `index.html` in browser
3. **Click Register** → Fill form → Check email for OTP
4. **Enter OTP** → Account verified → Redirected to home
5. **Logout** and **Login** again → Works without OTP
6. **Access protected routes** → Works with JWT token

## 📦 Complete Integration Checklist

- [ ] Backend server running on port 5000
- [ ] MySQL database created and configured
- [ ] Gmail configured with app password
- [ ] Frontend updated with API calls
- [ ] CORS configured properly
- [ ] Token storage in localStorage working
- [ ] Protected routes checking for authentication
- [ ] Logout functionality implemented

## 🎯 Next Steps

1. Add password reset functionality
2. Implement "Remember Me" with refresh tokens
3. Add profile update endpoints
4. Create dashboard for logged-in users
5. Add social login (Google, Facebook)

## 💡 Tips

- Always check browser console for errors
- Use browser DevTools Network tab to debug API calls
- Test OTP with a real email first
- Save JWT token securely (consider httpOnly cookies for production)
- Implement token refresh mechanism for better UX

---

**🎉 You're all set! Your authentication system is now fully integrated!**
