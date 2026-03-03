const API_BASE_URL = 'http://localhost:3000/api';

const destinationSelect = document.getElementById('appDestinationSelect');
const destinationHero = document.getElementById('destinationHero');
const spotsList = document.getElementById('spotsList');
const hotelsList = document.getElementById('hotelsList');
const generateBtn = document.getElementById('generateItinerary');
const itineraryOutput = document.getElementById('itineraryOutput');
const hotelSuggestion = document.getElementById('hotelSuggestion');
const budgetHotel = document.getElementById('budgetHotel');
const budgetFood = document.getElementById('budgetFood');
const budgetTransport = document.getElementById('budgetTransport');
const budgetTickets = document.getElementById('budgetTickets');
const budgetTotal = document.getElementById('budgetTotal');
const progressHotel = document.getElementById('progressHotel');
const progressFood = document.getElementById('progressFood');
const progressTransport = document.getElementById('progressTransport');
const progressTickets = document.getElementById('progressTickets');

let currentDestination = null;
let currentBudget = 0;
let revealObserver = null;
let pendingBooking = null;

const fallbackImage = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80';

function getStoredUser() {
    const stored = localStorage.getItem('user') || localStorage.getItem('voyago_user');
    return stored ? JSON.parse(stored) : null;
}

function ensureToastContainer() {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

function showToast(message, type = 'success') {
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = message;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2400);
}

function setHeroContent(destination) {
    currentDestination = destination;
    const imageUrl = destination.image_url || fallbackImage;
    destinationHero.innerHTML = `
        <div class="app-hero-bg" style="background-image: url('${imageUrl}')"></div>
        <div class="app-hero-content">
            <span class="badge">${destination.category || 'Destination'}</span>
            <h2>${destination.name}, ${destination.country}</h2>
            <p>Rating ${Number(destination.rating || 0).toFixed(1)} · Curated stays and spots</p>
        </div>
    `;
    observeReveals(destinationHero);
}

function truncateText(text, maxLength) {
    if (!text) return 'Details coming soon.';
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trim()}...`;
}

function renderSpots(items) {
    if (!items.length) {
        spotsList.innerHTML = '<div class="app-card">No tourist spots available.</div>';
        return;
    }

    const ratingFallback = Number(currentDestination?.rating || 4.6).toFixed(1);
    spotsList.innerHTML = items.map(spot => {
        const imageUrl = spot.image_url || currentDestination?.image_url || fallbackImage;
        return `
            <article class="spot-card reveal">
                <div class="card-media">
                    <img src="${imageUrl}" alt="${spot.name}">
                </div>
                <div>
                    <h4 class="card-title">${spot.name}</h4>
                    <div class="card-meta">
                        <span>${spot.category || 'Highlight'}</span>
                        <span class="card-rating">${Number(spot.rating || ratingFallback).toFixed(1)}★</span>
                    </div>
                </div>
                <p class="card-desc">${truncateText(spot.description, 80)}</p>
            </article>
        `;
    }).join('');
    observeReveals(spotsList);
}

function renderHotels(items) {
    if (!items.length) {
        hotelsList.innerHTML = '<div class="app-card">No hotels available.</div>';
        return;
    }

    hotelsList.innerHTML = items.map(hotel => {
        const imageUrl = hotel.image_url || currentDestination?.image_url || fallbackImage;
        const destinationId = currentDestination?.id || '';
        const hotelData = JSON.stringify(hotel).replace(/"/g, '&quot;');
        return `
            <article class="hotel-card reveal">
                <div class="card-media">
                    <img src="${imageUrl}" alt="${hotel.name}">
                </div>
                <div>
                    <h4 class="card-title">${hotel.name}</h4>
                    <div class="card-meta">
                        <span class="card-rating">${Number(hotel.rating || 0).toFixed(1)}★</span>
                        <span>Per night</span>
                    </div>
                </div>
                <p class="card-desc">${truncateText(hotel.description, 70)}</p>
                <div class="card-actions">
                    <span class="price-tag">₹${Number(hotel.price_per_night || 0).toLocaleString()} / night</span>
                    <button class="app-button book-now" type="button" data-hotel-id="${hotel.id}" data-destination-id="${destinationId}" data-hotel='${hotelData}'>Book Now</button>
                </div>
            </article>
        `;
    }).join('');
    observeReveals(hotelsList);
}

function updateBudgetBreakdown(basePrice) {
    const total = Math.round((Number(basePrice) || 0) * 1.2);
    currentBudget = total;

    if (!total) {
        [budgetHotel, budgetFood, budgetTransport, budgetTickets, budgetTotal]
            .forEach(el => { if (el) el.textContent = '₹0'; });
        [progressHotel, progressFood, progressTransport, progressTickets]
            .forEach(el => { if (el) el.style.width = '0%'; });
        return;
    }

    const breakdown = {
        hotel: Math.round(total * 0.4),
        food: Math.round(total * 0.25),
        transport: Math.round(total * 0.2),
        tickets: total - (Math.round(total * 0.4) + Math.round(total * 0.25) + Math.round(total * 0.2))
    };

    budgetHotel.textContent = `₹${breakdown.hotel.toLocaleString()}`;
    budgetFood.textContent = `₹${breakdown.food.toLocaleString()}`;
    budgetTransport.textContent = `₹${breakdown.transport.toLocaleString()}`;
    budgetTickets.textContent = `₹${breakdown.tickets.toLocaleString()}`;
    budgetTotal.textContent = `₹${total.toLocaleString()}`;

    progressHotel.style.width = '40%';
    progressFood.style.width = '25%';
    progressTransport.style.width = '20%';
    progressTickets.style.width = '15%';
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

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

function observeReveals(container) {
    if (!revealObserver) initRevealObserver();
    container.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

async function loadDestinations() {
    const response = await fetch(`${API_BASE_URL}/destinations`);
    const data = await response.json();
    const destinations = Array.isArray(data) ? data : data.destinations || [];

    destinationSelect.innerHTML = '<option value="">Select destination</option>' +
        destinations.map(dest => `<option value="${dest.id}">${dest.name}, ${dest.country}</option>`).join('');
}

async function loadDestinationData(destinationId) {
    if (!destinationId) return;
    const destResponse = await fetch(`${API_BASE_URL}/destinations/${destinationId}`);
    const destination = await destResponse.json();
    setHeroContent(destination);

    const spotsResponse = await fetch(`${API_BASE_URL}/spots/${destinationId}`);
    const spots = await spotsResponse.json();
    renderSpots(spots);

    const hotelsResponse = await fetch(`${API_BASE_URL}/hotels/${destinationId}`);
    const hotels = await hotelsResponse.json();
    renderHotels(hotels);

    updateBudgetBreakdown(destination.price_starting);
}

async function generateItinerary(destinationId) {
    itineraryOutput.innerHTML = '<div class="timeline-item">Generating itinerary...</div>';
    const response = await fetch(`${API_BASE_URL}/dashboard/itinerary/${destinationId}`);
    const data = await response.json();

    if (!data.success) {
        itineraryOutput.innerHTML = `<div class="timeline-item">${data.message || 'No itinerary available.'}</div>`;
        return;
    }

    const rows = data.itinerary.flatMap(day =>
        day.schedule.map(item => `
            <div class="timeline-item reveal">
                <span class="time-badge">${item.time}</span>
                <div class="timeline-title">${item.place}</div>
                <div class="timeline-meta">Day ${day.day} · ${item.category || 'Stop'}</div>
            </div>
        `)
    );
    itineraryOutput.innerHTML = rows.join('');
    observeReveals(itineraryOutput);
}

async function loadHotelSuggestion(destinationId) {
    const budget = currentBudget ? String(currentBudget) : '';
    const now = new Date();
    const timeParam = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const response = await fetch(
        `${API_BASE_URL}/dashboard/hotel-suggestion/${destinationId}?budget=${budget}&time=${timeParam}`
    );
    const data = await response.json();

    if (!data.success) {
        hotelSuggestion.innerHTML = `<p>${data.message || 'No suggestion available.'}</p>`;
        return;
    }

    const imageUrl = data.hotel.image_url || currentDestination?.image_url || fallbackImage;
    const price = Number(data.hotel.price || data.hotel.price_per_night || 0);
    hotelSuggestion.innerHTML = `
        <img src="${imageUrl}" alt="${data.hotel.name}">
        <div>
            <h4 class="card-title">${data.hotel.name}</h4>
            <div class="card-meta">
                <span class="card-rating">${Number(data.hotel.rating || 0).toFixed(1)}★</span>
                <span class="price-tag">₹${price.toLocaleString()} / night</span>
            </div>
        </div>
    `;
    observeReveals(hotelSuggestion);
}

function getModal() {
    return document.getElementById('bookingModal');
}

function openBookingModal({ hotelId, hotel, destinationId }) {
    pendingBooking = { hotelId, destinationId };

    const modal = getModal();
    const imageUrl = hotel.image_url || currentDestination?.image_url || fallbackImage;
    
    document.getElementById('bookingHotelImage').src = imageUrl;
    document.getElementById('bookingHotelName').textContent = hotel.name;
    document.getElementById('bookingHotelLocation').textContent = currentDestination?.name || 'Destination';
    document.getElementById('bookingHotelRating').textContent = `${Number(hotel.rating || 0).toFixed(1)}★`;
    document.getElementById('bookingHotelPrice').textContent = `₹${Number(hotel.price_per_night || 0).toLocaleString()} / night`;
    document.getElementById('pricePerNight').textContent = `₹${Number(hotel.price_per_night || 0).toLocaleString()}`;

    // Set minimum date to today
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayStr = formatDateForInput(today);
    const tomorrowStr = formatDateForInput(tomorrow);
    
    const checkInInput = document.getElementById('checkInDate');
    const checkOutInput = document.getElementById('checkOutDate');
    
    checkInInput.min = todayStr;
    checkOutInput.min = tomorrowStr;
    checkInInput.value = todayStr;
    checkOutInput.value = tomorrowStr;

    // Clear error
    document.getElementById('bookingError').classList.remove('show');
    document.getElementById('bookingError').textContent = '';
    
    // Calculate initial
    calculateBookingDetails();

    modal.classList.add('show');
}

function closeBookingModal() {
    const modal = getModal();
    modal.classList.remove('show');
    pendingBooking = null;
}

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateStr) {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
}

// Ensure date is in MySQL format (YYYY-MM-DD)
function formatDateForMySQL(dateString) {
    if (!dateString) return null;
    
    // HTML date input type="date" returns YYYY-MM-DD format natively
    // Just validate and return as-is
    const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
    if (isoPattern.test(dateString)) {
        return dateString;
    }
    
    // Handle DD-MM-YYYY format (legacy/manual input)
    const ddmmPattern = /^(\d{2})-(\d{2})-(\d{4})$/;
    const match = dateString.match(ddmmPattern);
    if (match) {
        return `${match[3]}-${match[2]}-${match[1]}`;
    }
    
    // Try to parse as Date object and format
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
    }
    
    return dateString;
}

function calculateBookingDetails() {
    const checkInInput = document.getElementById('checkInDate');
    const checkOutInput = document.getElementById('checkOutDate');
    
    if (!checkInInput.value || !checkOutInput.value) return;

    const checkIn = new Date(checkInInput.value);
    const checkOut = new Date(checkOutInput.value);
    
    // Validate dates
    const errorEl = document.getElementById('bookingError');
    const confirmBtn = document.getElementById('confirmBookingBtn');
    
    if (checkOut <= checkIn) {
        errorEl.textContent = 'Check-out date must be after check-in date.';
        errorEl.classList.add('show');
        confirmBtn.disabled = true;
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkIn < today) {
        errorEl.textContent = 'Check-in date cannot be in the past.';
        errorEl.classList.add('show');
        confirmBtn.disabled = true;
        return;
    }

    errorEl.classList.remove('show');
    confirmBtn.disabled = false;

    // Calculate nights
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const pricePerNight = Number(document.getElementById('pricePerNight').textContent.replace(/[₹,]/g, ''));
    const totalPrice = nights * pricePerNight;

    document.getElementById('nightsCount').textContent = nights;
    document.getElementById('totalPrice').textContent = `₹${totalPrice.toLocaleString()}`;
}

async function confirmBooking(event) {
    event.preventDefault();

    if (!pendingBooking) return;

    const checkInDate = document.getElementById('checkInDate').value;
    const checkOutDate = document.getElementById('checkOutDate').value;
    const nightsCount = parseInt(document.getElementById('nightsCount').textContent);
    const totalPrice = parseInt(
        document.getElementById('totalPrice').textContent.replace(/[₹,]/g, '')
    );

    const token = localStorage.getItem('token') || localStorage.getItem('voyago_token');
    const user = getStoredUser();

    if (!token || !user) {
        window.location.href = '/auth.html?mode=login';
        return;
    }

    const confirmBtn = document.getElementById('confirmBookingBtn');
    const confirmBtnText = document.getElementById('confirmBtnText');
    const confirmBtnLoader = document.getElementById('confirmBtnLoader');
    const errorEl = document.getElementById('bookingError');

    try {
        confirmBtn.disabled = true;
        confirmBtnText.style.display = 'none';
        confirmBtnLoader.style.display = 'inline-block';

        // Convert dates to MySQL format
        const formattedCheckIn = formatDateForMySQL(checkInDate);
        const formattedCheckOut = formatDateForMySQL(checkOutDate);

        const response = await fetch(`${API_BASE_URL}/dashboard/book-hotel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                user_id: user.id,
                hotel_id: pendingBooking.hotelId,
                destination_id: pendingBooking.destinationId || null,
                check_in_date: formattedCheckIn,
                check_out_date: formattedCheckOut,
                nights: nightsCount,
                total_price: totalPrice
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Booking failed');
        }

        showToast(`Booking confirmed! Booking ID: ${data.bookingId || ''}`, 'success');
        closeBookingModal();
        
        setTimeout(() => {
            window.location.href = '/app/my-trips/';
        }, 1200);
    } catch (error) {
        console.error(error);
        errorEl.textContent = error.message || 'Unable to complete booking.';
        errorEl.classList.add('show');
        confirmBtn.disabled = false;
        confirmBtnText.style.display = 'inline';
        confirmBtnLoader.style.display = 'none';
    }
}

async function bookHotel({ hotelId, hotel, destinationId }) {
    const token = localStorage.getItem('token') || localStorage.getItem('voyago_token');
    if (!token) {
        window.location.href = '/auth.html?mode=login';
        return;
    }

    const user = getStoredUser();
    if (!user) {
        window.location.href = '/auth.html?mode=login';
        return;
    }

    openBookingModal({ hotelId, hotel, destinationId });
}

function bindEvents() {
    destinationSelect.addEventListener('change', async (event) => {
        const destinationId = event.target.value;
        await loadDestinationData(destinationId);
        await loadHotelSuggestion(destinationId);
    });

    generateBtn.addEventListener('click', async () => {
        const destinationId = destinationSelect.value;
        if (!destinationId) return;
        await generateItinerary(destinationId);
    });

    // Hotel booking with modal
    hotelsList.addEventListener('click', (event) => {
        const button = event.target.closest('.book-now');
        if (!button) return;
        
        const hotel = JSON.parse(button.dataset.hotel);
        bookHotel({
            hotelId: button.dataset.hotelId,
            hotel: hotel,
            destinationId: button.dataset.destinationId
        });
    });

    // Modal event handlers
    const modal = getModal();
    const modalOverlay = modal.querySelector('.modal-overlay');
    const modalCloseBtn = modal.querySelector('.modal-close');
    const modalSecondaryBtn = modal.querySelector('.modal-close-btn');
    const bookingForm = document.getElementById('bookingForm');
    const checkInInput = document.getElementById('checkInDate');
    const checkOutInput = document.getElementById('checkOutDate');

    // Close modal
    const closeHandler = () => closeBookingModal();
    modalOverlay.addEventListener('click', closeHandler);
    modalCloseBtn.addEventListener('click', closeHandler);
    modalSecondaryBtn.addEventListener('click', closeHandler);

    // Date input listeners
    checkInInput.addEventListener('change', calculateBookingDetails);
    checkOutInput.addEventListener('change', calculateBookingDetails);

    // Form submission
    bookingForm.addEventListener('submit', confirmBooking);
}

initRevealObserver();
loadDestinations().then(bindEvents);
