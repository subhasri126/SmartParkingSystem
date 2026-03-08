// ============================================
// HERO INTERACTIVE BACKGROUND
// ============================================
let currentSlide = 4;
const slides = document.querySelectorAll('.hero-slide');
const heroCategories = document.querySelectorAll('.hero-category');

const SHARED_AUTH_API_BASES = (() => {
    const bases = [];
    const origin = window.location.origin;
    if (origin && origin.startsWith('http')) {
        bases.push(`${origin}/api/auth`);
    }
    bases.push('http://localhost:3000/api/auth');
    bases.push('http://127.0.0.1:3000/api/auth');
    return [...new Set(bases)];
})();

function hasLocalAuthState() {
    return (
        localStorage.getItem('userLoggedIn') === 'true' ||
        localStorage.getItem('voyago_is_logged_in') === 'true' ||
        Boolean(localStorage.getItem('token') || localStorage.getItem('voyago_token'))
    );
}

async function sharedAuthFetch(path, options = {}) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    let lastError;

    for (const base of SHARED_AUTH_API_BASES) {
        try {
            const response = await fetch(`${base}${normalizedPath}`, {
                credentials: 'include',
                ...options
            });

            const contentType = response.headers.get('content-type') || '';
            if (!response.ok && !contentType.includes('application/json')) {
                throw new Error(`Invalid auth response (${response.status})`);
            }

            return response;
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error('Auth API unavailable');
}

async function updateSharedNavbarAuth() {
    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) return;

    const localAuth = hasLocalAuthState();
    let isLoggedIn = localAuth;

    try {
        const response = await sharedAuthFetch('/session');
        const data = await response.json();
        isLoggedIn = Boolean(data?.authenticated) || localAuth;
    } catch (error) {
        isLoggedIn = localAuth;
    }

    const loginItem = navMenu.querySelector('a.btn-login')?.closest('li');
    const registerItem = navMenu.querySelector('a.btn-register')?.closest('li');
    let logoutBtn = navMenu.querySelector('#logoutBtn');

    if (isLoggedIn) {
        if (loginItem) loginItem.style.display = 'none';
        if (registerItem) registerItem.style.display = 'none';

        if (!logoutBtn) {
            // Add app links before logout
            const myTripsLi = document.createElement('li');
            myTripsLi.className = 'nav-item-app';
            myTripsLi.innerHTML = '<a href="/app/my-trips/" class="nav-link">My Trips</a>';
            navMenu.appendChild(myTripsLi);

            const parkingLi = document.createElement('li');
            parkingLi.className = 'nav-item-app';
            parkingLi.innerHTML = '<a href="/app/parking/" class="nav-link">Smart Parking</a>';
            navMenu.appendChild(parkingLi);

            const profileLi = document.createElement('li');
            profileLi.className = 'nav-item-app';
            profileLi.innerHTML = '<a href="/app/profile/" class="nav-link">Profile</a>';
            navMenu.appendChild(profileLi);

            const li = document.createElement('li');
            li.innerHTML = '<button id="logoutBtn" class="nav-link btn-login" type="button">Logout</button>';
            navMenu.appendChild(li);
            logoutBtn = li.querySelector('#logoutBtn');
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await sharedAuthFetch('/logout', { method: 'POST' });
                } catch (error) {
                    console.warn('Logout request failed', error);
                }

                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('voyago_token');
                localStorage.removeItem('voyago_user');
                localStorage.removeItem('voyago_is_logged_in');
                localStorage.removeItem('userLoggedIn');
                window.location.href = 'index.html';
            });
        }
        return;
    }

    if (loginItem) loginItem.style.display = '';
    if (registerItem) registerItem.style.display = '';
    
    // Remove app links
    navMenu.querySelectorAll('.nav-item-app').forEach(el => el.remove());
    
    const logoutItem = logoutBtn?.closest('li');
    if (logoutItem) logoutItem.remove();
}

// Preload check for hero images
slides.forEach(slide => {
    const bgImage = slide.style.backgroundImage;
    if (bgImage) {
        const urlMatch = bgImage.match(/url\(['"]?(.*?)['"]?\)/);
        if (urlMatch && urlMatch[1]) {
            const img = new Image();
            img.src = urlMatch[1];
            img.onerror = () => {
                // If image fails, set a nice gradient
                slide.style.backgroundImage = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            };
        }
    }
});

function showSlide(index) {
    slides.forEach((slide, i) => {
        slide.classList.remove('active');
        if (i === index) {
            slide.classList.add('active');
        }
    });
}

// Initialize default slide (planning/flat lay image)
if (slides.length > 0) {
    showSlide(4);
}

// Add hover event listeners to category elements
heroCategories.forEach(category => {
    category.addEventListener('mouseenter', function () {
        const imageIndex = parseInt(this.getAttribute('data-image'));
        currentSlide = imageIndex;
        showSlide(imageIndex);
    });
});

// ============================================
// FEATURED DESTINATIONS - MAKE IMAGES CLICKABLE
// ============================================
let destinationsMap = {}; // Store name -> id mapping

async function fetchDestinationsForNav() {
    try {
        const response = await fetch('http://localhost:3000/api/destinations');
        if (!response.ok) throw new Error('Failed to fetch');

        const destinations = await response.json();
        destinations.forEach(dest => {
            destinationsMap[dest.name.toLowerCase()] = dest.id;
        });

        setupFeaturedDestinationClicks();
        setupPopularDestinationClicks();
    } catch (error) {
        console.error('Failed to fetch destinations for navigation:', error);
    }
}

function setupFeaturedDestinationClicks() {
    const carouselCards = document.querySelectorAll('.carousel-card');
    carouselCards.forEach(card => {
        const title = card.querySelector('.carousel-card-content h3');
        if (title) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                const destinationName = title.textContent.split(', ')[0].toLowerCase();
                const destinationId = destinationsMap[destinationName];
                if (destinationId) {
                    window.location.href = `destination.html?id=${destinationId}`;
                }
            });
        }
    });
}

function setupPopularDestinationClicks() {
    const destinationCards = document.querySelectorAll('.destination-card');
    destinationCards.forEach(card => {
        const title = card.querySelector('.destination-name');
        if (title) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                const destinationName = title.textContent.split(', ')[0].toLowerCase();
                const destinationId = destinationsMap[destinationName];
                if (destinationId) {
                    window.location.href = `destination.html?id=${destinationId}`;
                }
            });
        }
    });
}

// ============================================
// START EXPLORING BUTTON
// ============================================
const ctaBtn = document.querySelector('.cta-btn');
if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
        window.location.href = 'explore.html';
    });
}

// ============================================
// STICKY NAVBAR WITH BACKDROP BLUR
// ============================================
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        if (navMenu) {
            navMenu.classList.remove('active');
        }
    });
});

// ============================================
// SCROLL REVEAL ANIMATIONS
// ============================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Elements to animate on scroll
const animateElements = document.querySelectorAll('.feature-card, .destination-card, .section-title, .promo-card, .cta-split-layout');
animateElements.forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
});

// ============================================
// SEARCH FUNCTIONALITY
// ============================================
const searchBtn = document.querySelector('.search-btn');
const searchInput = document.querySelector('.search-input');

if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            alert(`Searching for: ${searchTerm}\n\nThis is a demo search. In a real application, this would search for destinations, hotels, and restaurants.`);
        } else {
            alert('Please enter a search term');
        }
    });

    // Allow search on Enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });
}

// ============================================
// CTA BUTTON// Promo Card Animation
const promoCard = document.querySelector('.promo-card');
const promoCta = document.querySelector('.promo-card .hero-cta');

if (promoCta) {
    promoCta.addEventListener('mouseenter', () => {
        promoCard.style.transform = 'translateY(-5px)';
        promoCard.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.2)';
    });

    promoCta.addEventListener('mouseleave', () => {
        promoCard.style.transform = 'translateY(0)';
        promoCard.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
    });
}

// Smooth scroll for all anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add hover effect to destination cards
const destinationCards = document.querySelectorAll('.destination-card');
destinationCards.forEach(card => {
    card.addEventListener('click', () => {
        const destinationName = card.querySelector('.destination-name').textContent;
        alert(`Explore ${destinationName}\n\nDiscover hotels, restaurants, and attractions in this beautiful destination!`);
    });
});

// ============================================
// PAGE INITIALIZATION
// ============================================

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    updateSharedNavbarAuth();

    // Initial hero content animation
    setTimeout(() => {
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.style.opacity = '1';
        }
    }, 100);

    // Staggered animation for feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.1}s`;
    });

    // Staggered animation for destination cards
    const destCards = document.querySelectorAll('.destination-card');
    destCards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.15}s`;
    });

    // Add hover glow effect to buttons
    const buttons = document.querySelectorAll('button, .nav-link');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', function () {
            this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        });
    });

    // Initialize 3D Circular Carousel
    initCircularCarousel();

    // Fetch destinations and setup navigation for featured/popular cards
    fetchDestinationsForNav();
});

// ============================================
// 3D CIRCULAR SCROLLING CAROUSEL
// ============================================
// Helper to handle background image errors
function handleBackgroundImageError(element, fallbackGradient) {
    const bgImage = element.style.backgroundImage;
    if (bgImage) {
        const urlMatch = bgImage.match(/url\(['"]?(.*?)['"]?\)/);
        if (urlMatch && urlMatch[1]) {
            const img = new Image();
            img.src = urlMatch[1];
            img.onerror = () => {
                element.style.backgroundImage = fallbackGradient || 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
            };
        }
    }
}

// Carousel Functionality
function initCircularCarousel() {
    const carousel = document.querySelector('.circular-carousel');
    const cards = document.querySelectorAll('.carousel-card');
    const cardImages = document.querySelectorAll('.carousel-card-img');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');

    // Check images
    cardImages.forEach(imgDiv => {
        handleBackgroundImageError(imgDiv, 'linear-gradient(to top, #30cfd0 0%, #330867 100%)');
    });

    if (!carousel || cards.length === 0) return;

    const totalCards = cards.length;
    const angleStep = 360 / totalCards;
    const radius = 280; // Significantly reduced for subtle, minimal depth

    let currentRotation = 0;
    let targetRotation = 0;
    let isAutoRotating = true;
    let autoRotateTimer = null;
    let inactivityTimer = null;
    let isDragging = false;
    let startX = 0;
    let startRotation = 0;

    // Position cards in circular 3D layout
    function updateCarousel(instant = false) {
        if (!instant) {
            carousel.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        } else {
            carousel.style.transition = 'none';
        }

        carousel.style.transform = `rotateY(${currentRotation}deg)`;

        // Update each card's position and appearance
        cards.forEach((card, index) => {
            const angle = angleStep * index;
            const cardRotation = currentRotation + angle;
            const normalizedRotation = ((cardRotation % 360) + 360) % 360;

            // Calculate if card is front-facing
            const isFrontFacing = normalizedRotation > 320 || normalizedRotation < 40;
            const isNearFront = normalizedRotation > 280 || normalizedRotation < 80;

            // Apply transformations
            card.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;

            // Apply scale and opacity based on position - very subtle
            if (isFrontFacing) {
                card.style.opacity = '1';
                card.querySelector('.carousel-card-inner').style.transform = 'scale(1.02)';
                card.style.zIndex = '10';
            } else if (isNearFront) {
                card.style.opacity = '0.7';
                card.querySelector('.carousel-card-inner').style.transform = 'scale(1)';
                card.style.zIndex = '5';
            } else {
                card.style.opacity = '0.45';
                card.querySelector('.carousel-card-inner').style.transform = 'scale(0.98)';
                card.style.zIndex = '1';
            }
        });
    }

    // Smooth animation loop
    function animate() {
        const diff = targetRotation - currentRotation;
        if (Math.abs(diff) > 0.05) {
            currentRotation += diff * 0.08;
            updateCarousel(true);
        }
        requestAnimationFrame(animate);
    }
    animate();

    // Auto-rotation function - slowed down to 58 seconds
    function startAutoRotation() {
        if (autoRotateTimer) clearInterval(autoRotateTimer);

        autoRotateTimer = setInterval(() => {
            if (isAutoRotating) {
                targetRotation -= angleStep;
            }
        }, 7250); // Rotate every 7.25 seconds (total: 58 seconds for 8 cards)
    }

    // Stop auto-rotation
    function stopAutoRotation() {
        isAutoRotating = false;
        if (inactivityTimer) clearTimeout(inactivityTimer);
    }

    // Resume auto-rotation after inactivity
    function scheduleAutoResume() {
        if (inactivityTimer) clearTimeout(inactivityTimer);

        inactivityTimer = setTimeout(() => {
            isAutoRotating = true;
        }, 4000); // Resume after 4 seconds of inactivity
    }

    // Manual rotation function
    function rotateTo(direction) {
        stopAutoRotation();
        targetRotation += direction * angleStep;
        scheduleAutoResume();
    }

    // Mouse drag controls
    carousel.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startRotation = targetRotation;
        carousel.classList.add('dragging');
        stopAutoRotation();
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;
        const rotationDelta = deltaX * 0.25; // Reduced sensitivity for smoother control
        targetRotation = startRotation + rotationDelta;
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            carousel.classList.remove('dragging');

            // Snap to nearest card
            const snapRotation = Math.round(targetRotation / angleStep) * angleStep;
            targetRotation = snapRotation;

            scheduleAutoResume();
        }
    });

    // Touch controls for mobile
    let startTouchX = 0;

    carousel.addEventListener('touchstart', (e) => {
        startTouchX = e.touches[0].clientX;
        startRotation = targetRotation;
        stopAutoRotation();
    }, { passive: true });

    carousel.addEventListener('touchmove', (e) => {
        const deltaX = e.touches[0].clientX - startTouchX;
        const rotationDelta = deltaX * 0.25;
        targetRotation = startRotation + rotationDelta;
    }, { passive: true });

    carousel.addEventListener('touchend', () => {
        // Snap to nearest card
        const snapRotation = Math.round(targetRotation / angleStep) * angleStep;
        targetRotation = snapRotation;
        scheduleAutoResume();
    });

    // Mouse wheel control
    carousel.addEventListener('wheel', (e) => {
        e.preventDefault();
        stopAutoRotation();

        const delta = Math.sign(e.deltaY);
        targetRotation += delta * angleStep * 0.4;

        scheduleAutoResume();
    }, { passive: false });

    // Button controls
    if (prevBtn) {
        prevBtn.addEventListener('click', () => rotateTo(1));
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => rotateTo(-1));
    }

    // Pause auto-rotation on carousel hover
    carousel.addEventListener('mouseenter', () => {
        stopAutoRotation();
    });

    carousel.addEventListener('mouseleave', () => {
        scheduleAutoResume();
    });

    // Initialize
    updateCarousel(true);
    startAutoRotation();
}

// ============================================
// SMART PARKING SUMMARY
// ============================================

const HOME_API_BASE_URL = 'http://localhost:3000/api';

async function fetchParkingSummary() {
    try {
        const response = await fetch(`${HOME_API_BASE_URL}/parking/summary`);
        if (!response.ok) throw new Error('Failed to fetch parking summary');

        const result = await response.json();
        if (result.success && result.data) {
            updateParkingSummaryUI(result.data);
        }
    } catch (error) {
        console.error('Error fetching parking summary:', error);
        showParkingError();
    }
}

function updateParkingSummaryUI(data) {
    const totalEl = document.getElementById('totalSlots');
    const availableEl = document.getElementById('availableSlots');
    const occupiedEl = document.getElementById('occupiedSlots');
    const reservedEl = document.getElementById('reservedSlots');
    const lastUpdatedEl = document.getElementById('parkingLastUpdated');

    if (totalEl) totalEl.textContent = data.total || 0;
    if (availableEl) availableEl.textContent = data.available || 0;
    if (occupiedEl) occupiedEl.textContent = data.occupied || 0;
    if (reservedEl) reservedEl.textContent = data.reserved || 0;

    if (lastUpdatedEl && data.lastUpdated) {
        const date = new Date(data.lastUpdated);
        lastUpdatedEl.textContent = date.toLocaleString();
    }

    // Add animation to numbers
    animateParkingNumbers();
}

function animateParkingNumbers() {
    const numbers = document.querySelectorAll('.parking-stat-number');
    numbers.forEach(num => {
        num.style.animation = 'none';
        num.offsetHeight; // Trigger reflow
        num.style.animation = 'pulse 0.5s ease';
    });
}

function showParkingError() {
    const grid = document.getElementById('parkingSummaryGrid');
    if (grid) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6B7280;">
                <p>Unable to load parking data. Please try again later.</p>
            </div>
        `;
    }
}

// Initialize parking summary on page load
if (document.getElementById('parkingSummaryGrid')) {
    fetchParkingSummary();
    // Refresh every 5 seconds for real-time updates
    setInterval(fetchParkingSummary, 5000);
}
