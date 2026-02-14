// =====================================================
// VOYAGO AUTHENTICATION SYSTEM
// Complete Login & Registration with OTP Verification
// =====================================================

// ==================== CONFIG ====================
const AUTH_CONFIG = {
    OTP_DURATION: 300, // 5 minutes in seconds
    RESEND_COOLDOWN: 30, // 30 seconds
    MIN_PASSWORD_LENGTH: 8,
    API_ENDPOINT: '/api/auth', // Replace with your actual API
};

// ==================== STATE MANAGEMENT ====================
const authState = {
    currentForm: 'login',
    otpEmail: '',
    otpTimer: null,
    resendTimer: null,
    userRegistering: null,
};

// ==================== DOM ELEMENTS ====================
const elements = {
    toggleBtns: document.querySelectorAll('.toggle-btn'),
    toggleIndicator: document.querySelector('.toggle-indicator'),
    authForms: document.querySelectorAll('.auth-form'),
    switchFormBtns: document.querySelectorAll('.switch-form'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    otpModal: document.getElementById('otpModal'),
    otpForm: document.getElementById('otpForm'),
    otpInputs: document.querySelectorAll('.otp-input'),
    resendOtpBtn: document.getElementById('resendOtpBtn'),
    resendTimer: document.getElementById('resendTimer'),
    successModal: document.getElementById('successModal'),
    modalBackdrop: document.getElementById('modalBackdrop'),
    otpEmail: document.getElementById('otpEmail'),
    passwordToggles: document.querySelectorAll('.password-toggle'),
    rememberMe: document.getElementById('rememberMe'),
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    setupNavbar();
    loadRememberedEmail();
});

function initializeEventListeners() {
    // Toggle between Login and Register
    elements.toggleBtns.forEach((btn) => {
        btn.addEventListener('click', () => switchForm(btn.dataset.tab));
    });

    // Switch form buttons
    elements.switchFormBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            switchForm(btn.dataset.target);
        });
    });

    // Form submissions
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.registerForm.addEventListener('submit', handleRegister);
    elements.otpForm.addEventListener('submit', handleOtpVerification);

    // Password toggles
    elements.passwordToggles.forEach((btn) => {
        btn.addEventListener('click', togglePasswordVisibility);
    });

    // OTP input handling
    elements.otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => handleOtpInput(e, index));
        input.addEventListener('keydown', (e) => handleOtpKeydown(e, index));
        input.addEventListener('paste', handleOtpPaste);
    });

    // Resend OTP button
    elements.resendOtpBtn.addEventListener('click', handleResendOtp);

    // Close OTP modal
    document.querySelector('.otp-close-btn').addEventListener('click', closeOtpModal);
    elements.modalBackdrop.addEventListener('click', closeOtpModal);

    // Password strength indicator
    document.getElementById('registerPassword')?.addEventListener('input', updatePasswordStrength);

    // Real-time validation
    document.getElementById('registerEmail')?.addEventListener('blur', validateEmail);
    document.getElementById('loginEmail')?.addEventListener('blur', validateEmail);
    document.getElementById('registerPassword')?.addEventListener('blur', validatePassword);
    document.getElementById('confirmPassword')?.addEventListener('blur', validateConfirmPassword);
}

// ==================== FORM SWITCHING ====================
function switchForm(formName) {
    if (authState.currentForm === formName) return;

    // Update state
    authState.currentForm = formName;

    // Update toggle buttons
    elements.toggleBtns.forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.tab === formName);
    });

    // Update indicator position
    if (formName === 'register') {
        elements.toggleIndicator.classList.add('right');
    } else {
        elements.toggleIndicator.classList.remove('right');
    }

    // Update forms
    elements.authForms.forEach((form) => {
        form.classList.toggle('active', form.dataset.form === formName);
    });

    // Clear error messages
    clearFormErrors();
}

// ==================== LOGIN HANDLER ====================
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Validate
    if (!email || !password) {
        showFormError('loginEmail', 'Please fill in all fields');
        return;
    }

    if (!validateEmailFormat(email)) {
        showFormError('loginEmail', 'Please enter a valid email');
        return;
    }

    // Show loading state
    const submitBtn = elements.loginForm.querySelector('.auth-btn');
    setButtonLoading(submitBtn, true);

    try {
        // Simulate API call
        await simulateApiDelay(1500);

        // Check if user exists (simulated)
        const userExists = true; // In real app, check from backend
        const isVerified = true; // In real app, check from backend

        if (!userExists) {
            showFormError('loginEmail', 'Email not registered');
            setButtonLoading(submitBtn, false);
            return;
        }

        if (!isVerified) {
            // Show OTP verification
            authState.otpEmail = email;
            showOtpModal(email);
            setButtonLoading(submitBtn, false);
            return;
        }

        // Successful login
        saveLoginData(email, document.getElementById('rememberMe').checked);
        showSuccessModal();

        // Redirect after delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    } catch (error) {
        console.error('Login error:', error);
        showFormError('loginEmail', 'An error occurred. Please try again.');
        setButtonLoading(submitBtn, false);
    }
}

// ==================== REGISTER HANDLER ====================
async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;

    // Validate all fields
    let isValid = true;

    if (!name) {
        showFormError('registerName', 'Name is required');
        isValid = false;
    }

    if (!email) {
        showFormError('registerEmail', 'Email is required');
        isValid = false;
    } else if (!validateEmailFormat(email)) {
        showFormError('registerEmail', 'Please enter a valid email');
        isValid = false;
    }

    if (!password) {
        showFormError('registerPassword', 'Password is required');
        isValid = false;
    } else if (password.length < AUTH_CONFIG.MIN_PASSWORD_LENGTH) {
        showFormError('registerPassword', `Password must be at least ${AUTH_CONFIG.MIN_PASSWORD_LENGTH} characters`);
        isValid = false;
    } else if (!validatePasswordStrength(password)) {
        showFormError('registerPassword', 'Password must include uppercase, lowercase, and number');
        isValid = false;
    }

    if (password !== confirmPassword) {
        showFormError('confirmPassword', 'Passwords do not match');
        isValid = false;
    }

    if (!agreeTerms) {
        showFormError('agreeTerms', 'You must agree to the terms');
        isValid = false;
    }

    if (!isValid) return;

    // Show loading state
    const submitBtn = elements.registerForm.querySelector('.auth-btn');
    setButtonLoading(submitBtn, true);

    try {
        // Simulate API call
        await simulateApiDelay(1500);

        // Store user data temporarily
        authState.userRegistering = {
            name,
            email,
            password: hashPassword(password), // Simple hash (use proper hashing in production)
        };

        // Show OTP verification
        authState.otpEmail = email;
        showOtpModal(email);
        setButtonLoading(submitBtn, false);
    } catch (error) {
        console.error('Registration error:', error);
        showFormError('registerName', 'An error occurred. Please try again.');
        setButtonLoading(submitBtn, false);
    }
}

// ==================== OTP HANDLING ====================
function handleOtpInput(e, index) {
    const input = e.target;
    const value = input.value;

    // Only allow numbers
    if (!/^\d*$/.test(value)) {
        input.value = '';
        return;
    }

    // Move to next input if filled
    if (value.length === 1 && index < elements.otpInputs.length - 1) {
        elements.otpInputs[index + 1].focus();
    }

    // Update filled state
    input.classList.toggle('filled', value.length > 0);

    // Check if all fields are filled
    checkOtpComplete();
}

function handleOtpKeydown(e, index) {
    if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
        elements.otpInputs[index - 1].focus();
    }

    if (e.key === 'ArrowLeft' && index > 0) {
        elements.otpInputs[index - 1].focus();
    }

    if (e.key === 'ArrowRight' && index < elements.otpInputs.length - 1) {
        elements.otpInputs[index + 1].focus();
    }
}

function handleOtpPaste(e) {
    const paste = (e.clipboardData || window.clipboardData).getData('text');
    const digits = paste.replace(/\D/g, '').slice(0, 6);

    if (digits.length > 0) {
        elements.otpInputs.forEach((input, index) => {
            input.value = digits[index] || '';
            input.classList.toggle('filled', input.value.length > 0);
        });

        if (digits.length === 6) {
            checkOtpComplete();
            elements.otpForm.querySelector('.otp-submit-btn').focus();
        }
    }

    e.preventDefault();
}

function checkOtpComplete() {
    const allFilled = Array.from(elements.otpInputs).every((input) => input.value.length > 0);
    elements.otpForm.querySelector('.otp-submit-btn').disabled = !allFilled;
}

async function handleOtpVerification(e) {
    e.preventDefault();

    const otp = Array.from(elements.otpInputs).map((input) => input.value).join('');

    if (otp.length !== 6) {
        showOtpError('Please enter a valid 6-digit code');
        return;
    }

    // Show loading state
    const submitBtn = elements.otpForm.querySelector('.otp-submit-btn');
    setButtonLoading(submitBtn, true);

    try {
        // Simulate API call
        await simulateApiDelay(1500);

        // Simulate OTP verification (in real app, verify from backend)
        if (otp === '123456') {
            // OTP correct
            closeOtpModal();
            showSuccessModal();

            // Save verified data
            if (authState.userRegistering) {
                // Register user
                saveRegistrationData(authState.userRegistering);
            } else {
                // Login user
                saveLoginData(authState.otpEmail, false);
            }

            // Redirect after delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            // OTP incorrect
            showOtpError('Invalid verification code. Please try again.');
            elements.otpInputs.forEach((input) => input.classList.add('error'));

            setTimeout(() => {
                elements.otpInputs.forEach((input) => input.classList.remove('error'));
            }, 500);

            setButtonLoading(submitBtn, false);
        }
    } catch (error) {
        console.error('OTP verification error:', error);
        showOtpError('An error occurred. Please try again.');
        setButtonLoading(submitBtn, false);
    }
}

async function handleResendOtp() {
    if (elements.resendOtpBtn.disabled) return;

    // Disable button and start cooldown
    elements.resendOtpBtn.disabled = true;

    try {
        // Simulate sending OTP
        await simulateApiDelay(1000);

        // Start resend timer
        startResendTimer(AUTH_CONFIG.RESEND_COOLDOWN);

        // Show confirmation
        console.log('OTP resent to ' + authState.otpEmail);
    } catch (error) {
        console.error('Resend OTP error:', error);
        elements.resendOtpBtn.disabled = false;
    }
}

function startResendTimer(seconds) {
    let remaining = seconds;
    elements.resendTimer.textContent = remaining;

    if (authState.resendTimer) {
        clearInterval(authState.resendTimer);
    }

    authState.resendTimer = setInterval(() => {
        remaining--;
        elements.resendTimer.textContent = remaining;

        if (remaining <= 0) {
            clearInterval(authState.resendTimer);
            elements.resendOtpBtn.disabled = false;
        }
    }, 1000);
}

// ==================== PASSWORD HANDLING ====================
function togglePasswordVisibility(e) {
    const wrapper = e.currentTarget.closest('.password-input-wrapper');
    const input = wrapper.querySelector('input');

    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
}

function updatePasswordStrength() {
    const password = document.getElementById('registerPassword').value;
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text strong');

    let strength = 'Weak';
    let className = 'weak';

    if (password.length >= 12 && validatePasswordStrength(password)) {
        strength = 'Strong';
        className = 'strong';
    } else if (password.length >= 8) {
        strength = 'Medium';
        className = 'medium';
    }

    strengthBar.className = 'strength-bar ' + className;
    strengthText.textContent = strength;
}

// ==================== VALIDATION ====================
function validateEmailFormat(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateEmail(e) {
    const email = e.target.value.trim();
    const input = e.target;

    if (email && !validateEmailFormat(email)) {
        input.classList.add('error');
        showFormError(input.id, 'Please enter a valid email');
    } else {
        input.classList.remove('error');
        clearFormError(input.id);
    }
}

function validatePasswordStrength(password) {
    // At least one uppercase, one lowercase, and one number
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    return hasUppercase && hasLowercase && hasNumber;
}

function validatePassword(e) {
    const password = e.target.value;
    const input = e.target;

    let errorMsg = '';

    if (password.length < AUTH_CONFIG.MIN_PASSWORD_LENGTH) {
        errorMsg = `Password must be at least ${AUTH_CONFIG.MIN_PASSWORD_LENGTH} characters`;
    } else if (!validatePasswordStrength(password)) {
        errorMsg = 'Password must include uppercase, lowercase, and number';
    }

    if (errorMsg) {
        input.classList.add('error');
        showFormError(input.id, errorMsg);
    } else {
        input.classList.remove('error');
        clearFormError(input.id);
    }
}

function validateConfirmPassword(e) {
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = e.target.value;
    const input = e.target;

    if (confirmPassword && password !== confirmPassword) {
        input.classList.add('error');
        showFormError(input.id, 'Passwords do not match');
    } else {
        input.classList.remove('error');
        clearFormError(input.id);
    }
}

// ==================== ERROR HANDLING ====================
function showFormError(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const errorElement = input.closest('.form-group')?.querySelector('.error-message') ||
                        input.parentElement?.querySelector('.error-message');

    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }

    input.classList.add('error');
}

function clearFormError(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const errorElement = input.closest('.form-group')?.querySelector('.error-message') ||
                        input.parentElement?.querySelector('.error-message');

    if (errorElement) {
        errorElement.classList.remove('show');
    }

    input.classList.remove('error');
}

function clearFormErrors() {
    document.querySelectorAll('.error-message').forEach((el) => {
        el.classList.remove('show');
    });
    document.querySelectorAll('.form-input').forEach((el) => {
        el.classList.remove('error');
    });
}

function showOtpError(message) {
    const errorElement = document.querySelector('.otp-error');
    errorElement.textContent = message;
    errorElement.classList.add('show');

    setTimeout(() => {
        errorElement.classList.remove('show');
    }, 3000);
}

// ==================== MODAL MANAGEMENT ====================
function showOtpModal(email) {
    elements.otpEmail.textContent = email;
    elements.otpModal.classList.add('show');
    elements.modalBackdrop.classList.add('show');
    elements.otpInputs[0].focus();

    // Reset OTP inputs
    elements.otpInputs.forEach((input) => {
        input.value = '';
        input.classList.remove('error', 'filled');
    });

    // Start OTP timer
    startOtpTimer(AUTH_CONFIG.OTP_DURATION);

    // Enable resend button with cooldown
    startResendTimer(5);
}

function closeOtpModal() {
    elements.otpModal.classList.remove('show');
    elements.modalBackdrop.classList.remove('show');

    if (authState.otpTimer) {
        clearInterval(authState.otpTimer);
    }

    if (authState.resendTimer) {
        clearInterval(authState.resendTimer);
    }
}

function startOtpTimer(seconds) {
    if (authState.otpTimer) {
        clearInterval(authState.otpTimer);
    }

    // Timer logic can be added here if needed
    authState.otpTimer = setInterval(() => {
        // Update timer display if needed
    }, 1000);
}

function showSuccessModal() {
    elements.successModal.classList.add('show');
    elements.modalBackdrop.classList.add('show');
}

// ==================== UTILITY FUNCTIONS ====================
function setButtonLoading(button, isLoading) {
    button.disabled = isLoading;
    button.classList.toggle('loading', isLoading);

    const spinner = button.querySelector('.loading-spinner');
    const text = button.querySelector('.btn-text');

    if (isLoading) {
        spinner.classList.add('show');
        text.style.opacity = '0';
        text.style.position = 'absolute';
    } else {
        spinner.classList.remove('show');
        text.style.opacity = '1';
        text.style.position = 'relative';
    }
}

function simulateApiDelay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function hashPassword(password) {
    // Simple hash for demo (use bcrypt in production)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
}

function saveLoginData(email, remember) {
    if (remember) {
        localStorage.setItem('voyago_email', email);
    }

    // In production, save session token
    localStorage.setItem('voyago_user', JSON.stringify({
        email,
        loginTime: new Date().toISOString(),
    }));
}

function saveRegistrationData(userData) {
    localStorage.setItem('voyago_user', JSON.stringify({
        name: userData.name,
        email: userData.email,
        registerTime: new Date().toISOString(),
        verified: true,
    }));
}

function loadRememberedEmail() {
    const rememberedEmail = localStorage.getItem('voyago_email');
    if (rememberedEmail) {
        document.getElementById('loginEmail').value = rememberedEmail;
        document.getElementById('rememberMe').checked = true;
    }
}

// ==================== NAVBAR SETUP ====================
function setupNavbar() {
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        document.querySelectorAll('.nav-link').forEach((link) => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }
}

console.log('✅ Voyago Authentication System Initialized');
console.log('💡 Test OTP: 123456');
