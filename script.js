// ============================================
// HERO INTERACTIVE BACKGROUND
// ============================================
let currentSlide = 4;
const slides = document.querySelectorAll('.hero-slide');
const heroCategories = document.querySelectorAll('.hero-category');

function showSlide(index) {
    slides.forEach((slide, i) => {
        slide.classList.remove('active');
        if (i === index) {
            slide.classList.add('active');
        }
    });
}

// Initialize default slide (planning/flat lay image)
showSlide(4);

// Add hover event listeners to category elements
heroCategories.forEach(category => {
    category.addEventListener('mouseenter', function() {
        const imageIndex = parseInt(this.getAttribute('data-image'));
        currentSlide = imageIndex;
        showSlide(imageIndex);
    });
});

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

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
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

// ============================================
// CTA BUTTON INTERACTIONS
// ============================================
const ctaBtn = document.querySelector('.cta-btn');
if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
        // Scroll to hero section
        document.querySelector('.hero').scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
            alert('Welcome to Voyago! Start exploring amazing destinations around the world.');
        }, 500);
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
document.addEventListener('DOMContentLoaded', () => {
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
        btn.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        });
    });

    // Initialize 3D Circular Carousel
    initCircularCarousel();
});

// ============================================
// 3D CIRCULAR SCROLLING CAROUSEL
// ============================================
function initCircularCarousel() {
    const carousel = document.getElementById('circularCarousel');
    const cards = document.querySelectorAll('.carousel-card');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    
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
