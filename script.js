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
        }
    });
}, observerOptions);

// Add fade-in class to sections and observe them
const animateElements = document.querySelectorAll('.feature-card, .destination-card, .section-title, .carousel-3d-card, .carousel-ring-card, .promo-card, .carousel-3d-rotating-wrapper');
animateElements.forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
});

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

// 3D circular carousel interactions
const carouselRing = document.querySelector('.carousel-ring');
if (carouselRing) {
    const ringCards = Array.from(carouselRing.querySelectorAll('.carousel-ring-card'));
    let baseRotation = 0;
    let lastTime = performance.now();
    let isInteracting = false;
    let resumeTimeout = null;
    let pointerActive = false;
    let startX = 0;
    let startRotation = 0;
    let radius = 300;
    const autoSpeed = 6; // degrees per second

    const updateRadius = () => {
        const containerWidth = carouselRing.clientWidth;
        radius = Math.max(240, Math.min(360, containerWidth * 0.38));
    };

    const positionCards = () => {
        const step = 360 / ringCards.length;
        ringCards.forEach((card, index) => {
            const angle = baseRotation + index * step;
            const angleRad = (angle * Math.PI) / 180;
            const depth = Math.cos(angleRad);
            const scale = 0.9 + Math.max(0, depth) * 0.12;
            const opacity = 0.4 + Math.max(0, depth) * 0.6;
            card.style.transform = `translate(-50%, -50%) rotateY(${angle}deg) translateZ(${radius}px) scale(${scale})`;
            card.style.opacity = opacity.toFixed(2);
            card.style.filter = depth > 0 ? 'saturate(1)' : 'saturate(0.85)';
            card.style.zIndex = Math.round((depth + 1) * 50);
            card.classList.toggle('is-front', depth > 0.92);
        });
    };

    const scheduleResume = () => {
        if (resumeTimeout) {
            clearTimeout(resumeTimeout);
        }
        resumeTimeout = setTimeout(() => {
            isInteracting = false;
        }, 2500);
    };

    const onPointerDown = (event) => {
        pointerActive = true;
        isInteracting = true;
        if (resumeTimeout) {
            clearTimeout(resumeTimeout);
        }
        startX = event.clientX;
        startRotation = baseRotation;
        carouselRing.classList.add('is-dragging');
        carouselRing.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event) => {
        if (!pointerActive) {
            return;
        }
        const deltaX = event.clientX - startX;
        baseRotation = startRotation + deltaX * 0.35;
        positionCards();
    };

    const endPointer = (event) => {
        if (!pointerActive) {
            return;
        }
        pointerActive = false;
        carouselRing.classList.remove('is-dragging');
        carouselRing.releasePointerCapture(event.pointerId);
        scheduleResume();
    };

    const onWheel = (event) => {
        if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
            event.preventDefault();
            baseRotation += event.deltaX * 0.15;
            positionCards();
            isInteracting = true;
            scheduleResume();
        }
    };

    const animate = (time) => {
        const delta = (time - lastTime) / 1000;
        lastTime = time;
        if (!isInteracting) {
            baseRotation += autoSpeed * delta;
            positionCards();
        }
        requestAnimationFrame(animate);
    };

    updateRadius();
    positionCards();
    requestAnimationFrame(animate);

    carouselRing.addEventListener('pointerdown', onPointerDown);
    carouselRing.addEventListener('pointermove', onPointerMove);
    carouselRing.addEventListener('pointerup', endPointer);
    carouselRing.addEventListener('pointerleave', endPointer);
    carouselRing.addEventListener('pointercancel', endPointer);
    carouselRing.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', () => {
        updateRadius();
        positionCards();
    });
}

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
});

// Prevent double-tap zoom on mobile for buttons
document.addEventListener('touchend', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.classList.contains('btn')) {
        e.preventDefault();
        e.target.click();
    }
}, { passive: false });
