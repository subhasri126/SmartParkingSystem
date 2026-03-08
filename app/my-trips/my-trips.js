const API_BASE_URL = 'http://localhost:3000/api';
const fallbackImage = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80';

let allTrips = [];
let revealObserver = null;

function getStoredUser() {
    const stored = localStorage.getItem('user') || localStorage.getItem('voyago_user');
    return stored ? JSON.parse(stored) : null;
}

function formatDateDisplay(dateStr) {
    if (!dateStr) return 'TBD';
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
}

function formatCurrency(amount) {
    return `₹${Number(amount || 0).toLocaleString()}`;
}

function isTripsActive(checkInDate, checkOutDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    return checkOut > today;
}

function renderTripCard(trip) {
    const imageUrl = trip.destinationImage || trip.hotelImage || fallbackImage;
    const isActive = isTripsActive(trip.checkInDate, trip.checkOutDate);
    const statusBadge = isActive ? 'Upcoming' : 'Completed';
    const statusClass = isActive ? 'status-upcoming' : 'status-completed';

    // Parking Status rendering
    let parkingHtml = '';
    if (trip.parking) {
        const available = trip.parking.available || 0;
        const total = trip.parking.total || 0;
        const percent = Math.min(100, Math.max(0, (available / total) * 100));
        let badgeClass = 'high';
        let badgeText = 'Plenty';
        
        if (available === 0) {
            badgeClass = 'low';
            badgeText = 'Full';
        } else if (percent < 30) {
            badgeClass = 'low';
            badgeText = 'Low';
        } else if (percent < 60) {
            badgeClass = 'medium';
            badgeText = 'Steady';
        }

        parkingHtml = `
            <div class="trip-parking-status">
                <div class="parking-status-header">
                    <span class="parking-status-label">🅿️ Smart Parking</span>
                    <span class="parking-status-badge ${badgeClass}">${badgeText}</span>
                </div>
                <div class="parking-progress-container">
                    <div class="parking-progress-bar" style="width: ${percent}%;"></div>
                </div>
                <div class="parking-slots-info">
                    <span>Availability: <b>${available}</b> slots</span>
                    <span>Total: <b>${total}</b> slots</span>
                </div>
            </div>
        `;
    }
    
    return `
        <article class="trip-card reveal">
            <div class="card-media">
                <img src="${imageUrl}" alt="${trip.destinationName}">
                <span class="status-badge ${statusClass}">${statusBadge}</span>
            </div>
            <div class="trip-card-content">
                <h4 class="card-title">${trip.destinationName}${trip.destinationCountry ? `, ${trip.destinationCountry}` : ''}</h4>
                <div class="trip-hotel">
                    <span class="hotel-name">${trip.hotelName}</span>
                    <span class="hotel-rating">${trip.hotelRating}★</span>
                </div>
                
                <div class="trip-dates">
                    <div class="date-group">
                        <span class="date-label">Check-in</span>
                        <span class="date-value">${formatDateDisplay(trip.checkInDate)}</span>
                    </div>
                    <span class="date-separator">→</span>
                    <div class="date-group">
                        <span class="date-label">Check-out</span>
                        <span class="date-value">${formatDateDisplay(trip.checkOutDate)}</span>
                    </div>
                </div>

                ${parkingHtml}

                <div class="trip-meta">
                    <span class="nights">${trip.nights} night${trip.nights !== 1 ? 's' : ''}</span>
                    <span class="price-per-night">${formatCurrency(trip.pricePerNight)} / night</span>
                </div>

                <div class="trip-total">
                    <span>Total</span>
                    <span class="total-amount">${formatCurrency(trip.totalPrice)}</span>
                </div>

                <div class="trip-actions">
                    <a href="/app/explore/" class="app-button app-button--secondary">Explore more</a>
                </div>
            </div>
        </article>
    `;
}

function initRevealObserver() {
    if (revealObserver) return;
    revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
}

function observeReveals(container) {
    if (!revealObserver) initRevealObserver();
    container.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

function renderTrips() {
    const tripsList = document.getElementById('tripsList');
    const pastTripsList = document.getElementById('pastTripsList');
    const pastTripsSection = document.getElementById('pastTripsSection');
    const tripCount = document.getElementById('tripCount');

    if (!allTrips.length) {
        tripsList.innerHTML = `
            <div class="app-card" style="grid-column: 1 / -1; text-align: center; padding: 48px 24px;">
                <p style="color: var(--app-muted); margin-bottom: 16px;">No trips booked yet</p>
                <a href="/app/explore/" class="app-button app-button--primary" style="display: inline-block;">Start exploring</a>
            </div>
        `;
        tripCount.textContent = '0 trips';
        return;
    }

    const activeTrips = allTrips.filter(trip => isTripsActive(trip.checkInDate, trip.checkOutDate));
    const completedTrips = allTrips.filter(trip => !isTripsActive(trip.checkInDate, trip.checkOutDate));

    tripsList.innerHTML = activeTrips.map(trip => renderTripCard(trip)).join('');
    tripCount.textContent = `${activeTrips.length} upcoming trip${activeTrips.length !== 1 ? 's' : ''}`;

    observeReveals(tripsList);

    if (completedTrips.length > 0) {
        pastTripsSection.style.display = 'block';
        pastTripsList.innerHTML = completedTrips.map(trip => renderTripCard(trip)).join('');
        observeReveals(pastTripsList);
    } else {
        pastTripsSection.style.display = 'none';
    }
}

async function loadTrips() {
    const token = localStorage.getItem('token') || localStorage.getItem('voyago_token');
    const user = getStoredUser();

    if (!token || !user) {
        window.location.href = '/auth.html?mode=login';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/my-trips/${user.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to load trips');
        }

        const data = await response.json();
        allTrips = data.trips || [];
        renderTrips();
    } catch (error) {
        console.error('Error loading trips:', error);
        const tripsList = document.getElementById('tripsList');
        tripsList.innerHTML = `
            <div class="app-card" style="grid-column: 1 / -1; text-align: center; padding: 48px 24px;">
                <p style="color: #c33;">Unable to load trips. Please try again.</p>
            </div>
        `;
    }
}

// Initialize on page load
initRevealObserver();
loadTrips();
