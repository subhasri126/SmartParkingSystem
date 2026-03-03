const API_BASE_URL = 'http://localhost:3000/api';

function getStoredUser() {
    const stored = localStorage.getItem('user') || localStorage.getItem('voyago_user');
    return stored ? JSON.parse(stored) : null;
}

async function loadDestinations() {
    const select = document.getElementById('reviewDestination');
    const response = await fetch(`${API_BASE_URL}/destinations`);
    const data = await response.json();
    const destinations = Array.isArray(data) ? data : data.destinations || [];

    select.innerHTML = '<option value="">Select destination</option>' +
        destinations.map(dest => `<option value="${dest.id}">${dest.name}, ${dest.country}</option>`).join('');
}

async function loadRecentReviews(destinationId) {
    const list = document.getElementById('reviewList');
    if (!destinationId) {
        list.innerHTML = '<li>Select a destination to view reviews.</li>';
        return;
    }

    const response = await fetch(`${API_BASE_URL}/dashboard/reviews/${destinationId}`);
    const data = await response.json();

    if (!data.length) {
        list.innerHTML = '<li>No reviews yet.</li>';
        return;
    }

    list.innerHTML = data.slice(0, 5).map(review => `
        <li>
            ${review.user_name || 'Traveler'} · ${review.rating}★<br>
            ${review.review_text || 'No comment'}
        </li>
    `).join('');
}

async function submitReview(event) {
    event.preventDefault();

    const token = localStorage.getItem('token') || localStorage.getItem('voyago_token');
    const destinationId = document.getElementById('reviewDestination').value;
    const rating = document.getElementById('reviewRating').value;
    const reviewText = document.getElementById('reviewText').value.trim();
    const messageEl = document.getElementById('reviewMessage');

    if (!destinationId || !rating) return;

    const response = await fetch(`${API_BASE_URL}/dashboard/reviews`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ destination_id: destinationId, rating: Number(rating), review_text: reviewText })
    });

    const data = await response.json();
    if (!response.ok) {
        messageEl.textContent = data.message || 'Failed to submit review.';
        return;
    }

    messageEl.textContent = data.message || 'Review saved.';
    document.getElementById('reviewText').value = '';
    await loadRecentReviews(destinationId);
}

function initReviews() {
    const form = document.getElementById('reviewForm');
    const select = document.getElementById('reviewDestination');

    loadDestinations().then(() => {
        select.addEventListener('change', () => loadRecentReviews(select.value));
    });

    if (form) {
        form.addEventListener('submit', submitReview);
    }
}

initReviews();
