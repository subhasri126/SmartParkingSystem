function getStoredUser() {
    const stored = localStorage.getItem('user') || localStorage.getItem('voyago_user');
    return stored ? JSON.parse(stored) : null;
}

function loadProfile() {
    const list = document.getElementById('profileDetails');
    if (!list) return;

    const user = getStoredUser();
    if (!user) {
        list.innerHTML = '<li>Please log in to view profile details.</li>';
        return;
    }

    list.innerHTML = `
        <li>Name: ${user.full_name || 'Traveler'}</li>
        <li>Email: ${user.email || '-'}</li>
        <li>Status: Verified</li>
    `;
}

loadProfile();
