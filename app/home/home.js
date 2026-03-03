const API_BASE_URL = 'http://localhost:3000/api';

function getStoredUser() {
    const stored = localStorage.getItem('user') || localStorage.getItem('voyago_user');
    return stored ? JSON.parse(stored) : null;
}

async function loadRecentSearches(userId, token) {
    const list = document.getElementById('recentSearches');
    if (!list) return;

    list.innerHTML = '<li>Loading recent searches...</li>';
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/search-history/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to load search history');

        if (!data.length) {
            list.innerHTML = '<li>No recent searches yet.</li>';
            return;
        }

        list.innerHTML = data.slice(0, 5).map(item => `
            <li>${item.name}, ${item.country}</li>
        `).join('');
    } catch (error) {
        console.error(error);
        list.innerHTML = '<li>Unable to load recent searches.</li>';
    }
}

async function loadSavedTrips(userId, token) {
    const list = document.getElementById('savedTrips');
    if (!list) return;

    list.innerHTML = '<li>Loading saved trips...</li>';
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/bookings/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to load bookings');

        if (!data.bookings || !data.bookings.length) {
            list.innerHTML = '<li>No saved trips yet.</li>';
            return;
        }

        list.innerHTML = data.bookings.slice(0, 4).map(item => `
            <li>${item.hotel_name} · ${item.destination_name}</li>
        `).join('');
    } catch (error) {
        console.error(error);
        list.innerHTML = '<li>Unable to load saved trips.</li>';
    }
}

async function loadSuggestedDestination() {
    const card = document.getElementById('suggestedDestination');
    if (!card) return;

    try {
        const response = await fetch(`${API_BASE_URL}/destinations?sort=rating&limit=1`);
        const data = await response.json();
        const destination = Array.isArray(data) ? data[0] : data.destinations?.[0];

        if (!destination) {
            card.textContent = 'No suggestions yet.';
            return;
        }

        card.textContent = `${destination.name}, ${destination.country}`;
    } catch (error) {
        console.error(error);
        card.textContent = 'No suggestions yet.';
    }
}

async function loadStats(userId, token) {
    const tripsEl = document.getElementById('statTrips');
    const reviewsEl = document.getElementById('statReviews');
    const budgetEl = document.getElementById('statBudget');

    if (!tripsEl || !reviewsEl || !budgetEl) return;

    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/stats/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to load stats');

        tripsEl.textContent = data.total_bookings || 0;
        reviewsEl.textContent = data.total_reviews || 0;
        budgetEl.textContent = `₹${Number(data.total_spent || 0).toLocaleString()}`;
    } catch (error) {
        console.error(error);
        tripsEl.textContent = '0';
        reviewsEl.textContent = '0';
        budgetEl.textContent = '₹0';
    }
}

function updateWelcomeName() {
    const user = getStoredUser();
    const nameEl = document.getElementById('userName');
    if (user && nameEl) {
        nameEl.textContent = user.full_name || user.email || 'Traveler';
    }
}

function initHome() {
    updateWelcomeName();
    const token = localStorage.getItem('token') || localStorage.getItem('voyago_token');
    const user = getStoredUser();

    if (token && user) {
        loadRecentSearches(user.id, token);
        loadSavedTrips(user.id, token);
        loadStats(user.id, token);
    }

    loadSuggestedDestination();
}

initHome();
