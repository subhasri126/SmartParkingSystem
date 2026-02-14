// Sticky Navbar on Scroll
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

// Smooth Fade-in Animation on Scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            
            // Trigger counter animation for statistics
            if (entry.target.classList.contains('stat-item')) {
                animateCounter(entry.target);
            }
        }
    });
}, observerOptions);

// Add fade-in class to sections and observe them
const animateElements = document.querySelectorAll('.feature-card, .destination-card, .section-title, .stat-item, .carousel-3d-card, .promo-card, .carousel-3d-rotating-wrapper');
animateElements.forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
});

// Animated Counter for Statistics
function animateCounter(statItem) {
    const numberElement = statItem.querySelector('.stat-number');
    if (numberElement && !numberElement.classList.contains('counted')) {
        numberElement.classList.add('counted');
        const target = parseInt(numberElement.getAttribute('data-target'));
        const duration = 2000; // 2 seconds
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                numberElement.textContent = target.toLocaleString();
                clearInterval(timer);
            } else {
                numberElement.textContent = Math.floor(current).toLocaleString();
            }
        }, duration / steps);
    }
}

// Search Functionality (Basic implementation)
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

// CTA Button Click Handler
const ctaBtn = document.querySelector('.cta-btn');
ctaBtn.addEventListener('click', () => {
    // Scroll to hero section or show registration modal
    document.querySelector('.hero').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
        alert('Welcome to Voyago! Start exploring amazing destinations around the world.');
    }, 500);
});

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

// 3D Carousel card interactions
const carousel3dCards = document.querySelectorAll('.carousel-3d-card');
carousel3dCards.forEach(card => {
    card.addEventListener('click', () => {
        const cardTitle = card.querySelector('h4').textContent;
        alert(`${cardTitle}\n\nExplore this amazing experience! Book your adventure today.`);
    });
});

// Pause 3D carousel on hover
const carousel3dTrack = document.querySelector('.carousel-3d-track');
if (carousel3dTrack) {
    carousel3dTrack.addEventListener('mouseenter', () => {
        carousel3dTrack.style.animationPlayState = 'paused';
    });
    
    carousel3dTrack.addEventListener('mouseleave', () => {
        carousel3dTrack.style.animationPlayState = 'running';
    });
}

// Pause 3D rotating carousel on hover
const carousel3dRotating = document.querySelector('.carousel-3d-rotating');
if (carousel3dRotating) {
    carousel3dRotating.addEventListener('mouseenter', () => {
        carousel3dRotating.style.animationPlayState = 'paused';
    });
    
    carousel3dRotating.addEventListener('mouseleave', () => {
        carousel3dRotating.style.animationPlayState = 'running';
    });
}

// Add click effect to 3D carousel items
const carousel3dItems = document.querySelectorAll('.carousel-3d-item');
carousel3dItems.forEach(item => {
    item.addEventListener('click', () => {
        const img = item.querySelector('img');
        const currentTransform = img.style.transform;
        img.style.transform = currentTransform + ' scale(1.15)';
        setTimeout(() => {
            img.style.transform = currentTransform;
        }, 400);
    });
});

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Trigger initial animations
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
    
    // Staggered animation for stat items
    const statItems = document.querySelectorAll('.stat-item');
    statItems.forEach((item, index) => {
        item.style.transitionDelay = `${index * 0.1}s`;
    });
});

// Prevent double-tap zoom on mobile for buttons
document.addEventListener('touchend', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.classList.contains('btn')) {
        e.preventDefault();
        e.target.click();
    }
}, { passive: false });
