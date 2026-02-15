// =====================================================
// ABOUT PAGE - MINIMAL INTERACTIONS
// =====================================================

document.addEventListener('DOMContentLoaded', function() {
    
    // Parallax effect for hero section
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const heroImg = document.querySelector('.about-hero-bg');
        const experienceBg = document.querySelector('.experience-bg');
        
        if (heroImg && scrolled < window.innerHeight) {
            heroImg.style.transform = `translateY(${scrolled * 0.4}px)`;
        }
        
        // Parallax for experience banner
        if (experienceBg) {
            const experienceSection = document.querySelector('.experience-banner');
            const rect = experienceSection.getBoundingClientRect();
            const scrollPercent = (window.innerHeight - rect.top) / window.innerHeight;
            
            if (scrollPercent > 0 && scrollPercent < 1) {
                experienceBg.style.transform = `translateY(${scrollPercent * 50}px)`;
            }
        }
    });

    // Simple fade-in on scroll for sections
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px'
    };

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe sections for subtle reveal
    const sections = document.querySelectorAll('.brand-story-section, .philosophy-section, .experience-banner, .cta-section');
    sections.forEach((section, index) => {
        section.style.opacity = '0.3';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        fadeObserver.observe(section);
    });

});
