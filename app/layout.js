(function () {
    const token = localStorage.getItem('token') || localStorage.getItem('voyago_token');
    if (!token) {
        window.location.replace('/auth.html?mode=login');
        return;
    }

    const logoutBtn = document.getElementById('appLogout');
    if (logoutBtn && !logoutBtn.dataset.bound) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('voyago_token');
            localStorage.removeItem('voyago_user');
            window.location.replace('/');
        });
        logoutBtn.dataset.bound = 'true';
    }

    const currentPath = window.location.pathname.replace(/\/+$/, '');
    document.querySelectorAll('[data-app-nav]')
        .forEach(link => {
            const linkPath = link.getAttribute('href').replace(/\/+$/, '');
            if (currentPath.endsWith(linkPath)) {
                link.classList.add('active');
            }
        });

    const revealItems = document.querySelectorAll('.reveal');
    if (revealItems.length) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        revealItems.forEach(item => observer.observe(item));
    }
})();
