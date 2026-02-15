// =====================================================
// VOYAGO DASHBOARD SCRIPT
// Personalized user dashboard with itinerary, hotels, reviews
// =====================================================

const API_BASE_URL = 'http://localhost:5000/api';

// State
let currentUser = null;
let currentDestination = null;
let selectedHotelForBooking = null;
let userRating = 0;

// ==================== AUTHENTICATION ====================
function checkAuthentication() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token) {
        window.location.href = 'auth.html?mode=login';
        return false;
    }
    
    try {
        currentUser = JSON.parse(userStr);
        const userName = document.getElementById('userName');
        if (userName && currentUser) {
            userName.textContent = currentUser.full_name || currentUser.email || 'Traveler';
        }
    } catch (e) {
        console.error('Failed to parse user data');
    }
    
    return true;
}

// ==================== LOGOUT ====================
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.clear();
            window.location.href = 'index.html';
        });
    }
}

// ==================== LOAD DESTINATION ====================
async function loadCurrentDestination() {
    const destId = sessionStorage.getItem('selectedDestinationId');
    
    if (!destId) {
        document.getElementById('currentDestinationCard').innerHTML = 
            '<p class="empty-state">No destination selected. <a href="explore.html">Browse destinations</a></p>';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/destinations/${destId}`);
        if (!response.ok) throw new Error('Failed to fetch destination');
        
        currentDestination = await response.json();
        renderCurrentDestination();
        
        // Load related data
        await Promise.all([
            loadSearchHistory(),
            loadTouristSpots(),
            loadHotels(),
            calculateBudget(),
            loadBookings()
        ]);
        
    } catch (error) {
        console.error('Error loading destination:', error);
        document.getElementById('currentDestinationCard').innerHTML = 
            '<p class="error-state">Failed to load destination data.</p>';
    }
}

function renderCurrentDestination() {
    const container = document.getElementById('currentDestinationCard');
    
    container.innerHTML = `
        <div class="current-dest-card">
            <div class="dest-image" style="background-image: url('${currentDestination.image_url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80'}');"></div>
            <div class="dest-info">
                <h3 class="dest-name">${currentDestination.name}</h3>
                <p class="dest-location">📍 ${currentDestination.country}, ${currentDestination.continent}</p>
                <p class="dest-category">🏷️ ${currentDestination.category || 'Adventure'}</p>
                <div class="dest-stats">
                    <span class="stat">⭐ ${Number(currentDestination.rating || 0).toFixed(1)}</span>
                    <span class="stat">💰 From $${Number(currentDestination.price_starting || 0).toLocaleString()}</span>
                </div>
                <p class="dest-description">${currentDestination.description || ''}</p>
            </div>
        </div>
    `;
    
    // Save to search history
    saveSearchHistory(currentDestination.id);
}

// ==================== SEARCH HISTORY ====================
async function saveSearchHistory(destinationId) {
    if (!currentUser) return;
    
    try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE_URL}/dashboard/search-history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                user_id: currentUser.id,
                destination_id: destinationId 
            })
        });
    } catch (error) {
        console.error('Error saving search history:', error);
    }
}

async function loadSearchHistory() {
    if (!currentUser) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/dashboard/search-history/${currentUser.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch history');
        
        const history = await response.json();
        renderSearchHistory(history);
    } catch (error) {
        console.error('Error loading search history:', error);
        document.getElementById('searchHistoryGrid').innerHTML = 
            '<p class="empty-state">No search history yet.</p>';
    }
}

function renderSearchHistory(history) {
    const container = document.getElementById('searchHistoryGrid');
    
    if (!history || history.length === 0) {
        container.innerHTML = '<p class="empty-state">No previous searches.</p>';
        return;
    }
    
    container.innerHTML = history.map(item => `
        <div class="history-card" onclick="window.location.href='destination.html?id=${item.destination_id}'">
            <div class="history-image" style="background-image: url('${item.image_url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80'}');"></div>
            <div class="history-info">
                <h4>${item.destination_name || item.name}</h4>
                <p>${item.country || ''}</p>
                <span class="history-date">${formatDate(item.search_date || item.created_at)}</span>
            </div>
        </div>
    `).join('');
}

// ==================== ITINERARY GENERATION ====================
async function loadTouristSpots() {
    if (!currentDestination) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/spots/${currentDestination.id}`);
        if (!response.ok) throw new Error('Failed to fetch spots');
        
        let spots = await response.json();
        
        // Check if we have ratings data for spots
        const token = localStorage.getItem('token');
        const ratingsResponse = await fetch(`${API_BASE_URL}/dashboard/spot-ratings/${currentDestination.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null);
        
        let spotRatings = {};
        if (ratingsResponse && ratingsResponse.ok) {
            const ratings = await ratingsResponse.json();
            spotRatings = ratings.reduce((acc, r) => {
                acc[r.spot_id] = r.avg_rating;
                return acc;
            }, {});
        }
        
        // Assign ratings to spots
        spots = spots.map(spot => ({
            ...spot,
            avg_rating: spotRatings[spot.id] || Math.random() * 2 + 3 // Default 3-5 if no rating
        }));
        
        // Sort by rating (higher first) then shuffle within rating tiers
        spots.sort((a, b) => b.avg_rating - a.avg_rating);
        
        // Generate personalized itinerary
        generatePersonalizedItinerary(spots);
        
    } catch (error) {
        console.error('Error loading tourist spots:', error);
        document.getElementById('itineraryContainer').innerHTML = 
            '<p class="error-state">Failed to generate itinerary.</p>';
    }
}

function generatePersonalizedItinerary(spots) {
    const container = document.getElementById('itineraryContainer');
    
    if (!spots || spots.length === 0) {
        container.innerHTML = '<p class="empty-state">No tourist spots available for this destination.</p>';
        return;
    }
    
    // Time slots with smart allocation
    const timeSlots = [
        { time: '9:00 AM', label: 'Morning Start', icon: '🌅' },
        { time: '12:00 PM', label: 'Lunch Break', icon: '🍽️' },
        { time: '3:00 PM', label: 'Afternoon Adventure', icon: '🎯' },
        { time: '6:00 PM', label: 'Evening Experience', icon: '🌆' }
    ];
    
    // Create shuffled copy for randomization
    const shuffledSpots = [...spots].sort(() => 0.5 - Math.random());
    
    // Take top spots (max 4 for itinerary)
    const selectedSpots = shuffledSpots.slice(0, Math.min(4, shuffledSpots.length));
    
    container.innerHTML = selectedSpots.map((spot, index) => {
        const slot = timeSlots[index] || timeSlots[3];
        return `
            <div class="itinerary-item">
                <div class="time-badge">${slot.icon} ${slot.time}</div>
                <div class="itinerary-content">
                    <h4 class="itinerary-title">${spot.name}</h4>
                    <p class="itinerary-category">${spot.category || 'Attraction'}</p>
                    <p class="itinerary-desc">${spot.description || ''}</p>
                    <div class="itinerary-rating">
                        ⭐ ${spot.avg_rating.toFixed(1)} (Popular choice)
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== SMART HOTEL RECOMMENDATIONS ====================
async function loadHotels() {
    if (!currentDestination) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/hotels/${currentDestination.id}`);
        if (!response.ok) throw new Error('Failed to fetch hotels');
        
        let hotels = await response.json();
        
        if (!hotels || hotels.length === 0) {
            document.getElementById('hotelsContainer').innerHTML = 
                '<p class="empty-state">No hotels available for this destination.</p>';
            return;
        }
        
        // Smart hotel recommendation based on current time
        const currentHour = new Date().getHours();
        let recommendedHotels = [...hotels];
        
        if (currentHour >= 6 && currentHour < 12) {
            // Morning: Suggest budget-friendly
            recommendedHotels.sort((a, b) => a.price_per_night - b.price_per_night);
            document.getElementById('hotelTimeInfo').innerHTML = 
                '🌅 Morning deals: Budget-friendly options for you!';
        } else if (currentHour >= 18) {
            // Evening: Suggest nearby/highly rated
            recommendedHotels.sort((a, b) => b.rating - a.rating);
            document.getElementById('hotelTimeInfo').innerHTML = 
                '🌙 Evening picks: Top-rated hotels near your last stop!';
        } else {
            // Afternoon: Mix of both
            recommendedHotels.sort((a, b) => (b.rating / b.price_per_night) - (a.rating / a.price_per_night));
            document.getElementById('hotelTimeInfo').innerHTML = 
                '☀️ Best value hotels for your stay!';
        }
        
        renderHotels(recommendedHotels);
        
    } catch (error) {
        console.error('Error loading hotels:', error);
        document.getElementById('hotelsContainer').innerHTML = 
            '<p class="error-state">Failed to load hotels.</p>';
    }
}

function renderHotels(hotels) {
    const container = document.getElementById('hotelsContainer');
    
    container.innerHTML = hotels.map(hotel => `
        <div class="hotel-dashboard-card">
            <div class="hotel-dash-image" style="background-image: url('${hotel.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80'}');"></div>
            <div class="hotel-dash-info">
                <h4 class="hotel-dash-name">${hotel.name}</h4>
                <div class="hotel-dash-rating">⭐ ${Number(hotel.rating || 0).toFixed(1)}</div>
                <p class="hotel-dash-desc">${hotel.description || ''}</p>
                <div class="hotel-dash-footer">
                    <span class="hotel-dash-price">₹${Number(hotel.price_per_night || 0).toLocaleString()}/night</span>
                    <button class="btn btn-small btn-book" onclick="openBookingModal(${hotel.id}, '${hotel.name}', ${hotel.price_per_night})">
                        Book Now
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ==================== BUDGET CALCULATION ====================
async function calculateBudget() {
    if (!currentDestination) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/hotels/${currentDestination.id}`);
        const hotels = await response.json();
        
        const avgHotelPrice = hotels.length > 0 
            ? hotels.reduce((sum, h) => sum + Number(h.price_per_night), 0) / hotels.length
            : 2000;
        
        // Calculate estimated costs
        const accommodation = avgHotelPrice * 3; // 3 nights
        const food = 1500 * 3; // ₹1500 per day
        const transport = 3000; // Local transport
        const activities = 2000; // Entry fees
        const miscellaneous = 1000;
        
        const total = accommodation + food + transport + activities + miscellaneous;
        
        renderBudget({
            accommodation,
            food,
            transport,
            activities,
            miscellaneous,
            total
        });
        
    } catch (error) {
        console.error('Error calculating budget:', error);
        document.getElementById('budgetContainer').innerHTML = 
            '<p class="error-state">Failed to calculate budget.</p>';
    }
}

function renderBudget(budget) {
    const container = document.getElementById('budgetContainer');
    
    container.innerHTML = `
        <div class="budget-card">
            <div class="budget-item">
                <span class="budget-label">🏨 Accommodation (3 nights)</span>
                <span class="budget-value">₹${budget.accommodation.toLocaleString()}</span>
            </div>
            <div class="budget-item">
                <span class="budget-label">🍽️ Food & Dining</span>
                <span class="budget-value">₹${budget.food.toLocaleString()}</span>
            </div>
            <div class="budget-item">
                <span class="budget-label">🚗 Local Transport</span>
                <span class="budget-value">₹${budget.transport.toLocaleString()}</span>
            </div>
            <div class="budget-item">
                <span class="budget-label">🎟️ Activities & Entry Fees</span>
                <span class="budget-value">₹${budget.activities.toLocaleString()}</span>
            </div>
            <div class="budget-item">
                <span class="budget-label">🛍️ Miscellaneous</span>
                <span class="budget-value">₹${budget.miscellaneous.toLocaleString()}</span>
            </div>
            <div class="budget-total">
                <span class="budget-label"><strong>Total Estimated Cost</strong></span>
                <span class="budget-value"><strong>₹${budget.total.toLocaleString()}</strong></span>
            </div>
        </div>
    `;
}

// ==================== BOOKING SYSTEM ====================
function openBookingModal(hotelId, hotelName, pricePerNight) {
    selectedHotelForBooking = { id: hotelId, name: hotelName, price: pricePerNight };
    
    document.getElementById('bookingHotelName').textContent = hotelName;
    document.getElementById('bookingHotelPrice').textContent = `₹${Number(pricePerNight).toLocaleString()}/night`;
    
    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('checkInDate').min = today;
    document.getElementById('checkOutDate').min = today;
    
    document.getElementById('bookingModal').classList.add('active');
    
    // Calculate total on date change
    ['checkInDate', 'checkOutDate', 'numGuests'].forEach(id => {
        document.getElementById(id).addEventListener('change', calculateBookingTotal);
    });
}

function calculateBookingTotal() {
    if (!selectedHotelForBooking) return;
    
    const checkIn = document.getElementById('checkInDate').value;
    const checkOut = document.getElementById('checkOutDate').value;
    
    if (checkIn && checkOut) {
        const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
        const total = nights > 0 ? nights * selectedHotelForBooking.price : 0;
        document.getElementById('bookingTotal').textContent = `₹${total.toLocaleString()}`;
    }
}

async function confirmBooking() {
    if (!selectedHotelForBooking || !currentUser) return;
    
    const checkIn = document.getElementById('checkInDate').value;
    const checkOut = document.getElementById('checkOutDate').value;
    const numGuests = document.getElementById('numGuests').value;
    
    if (!checkIn || !checkOut) {
        alert('Please select check-in and check-out dates');
        return;
    }
    
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    const amount = nights * selectedHotelForBooking.price;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/dashboard/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                hotel_id: selectedHotelForBooking.id,
                check_in: checkIn,
                check_out: checkOut,
                num_guests: numGuests,
                amount: amount
            })
        });
        
        if (!response.ok) throw new Error('Booking failed');
        
        alert('✅ Booking confirmed successfully!');
        closeBookingModal();
        loadBookings();
        
    } catch (error) {
        console.error('Error confirming booking:', error);
        alert('❌ Failed to confirm booking. Please try again.');
    }
}

function closeBookingModal() {
    document.getElementById('bookingModal').classList.remove('active');
    selectedHotelForBooking = null;
}

async function loadBookings() {
    if (!currentUser) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/dashboard/bookings/${currentUser.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch bookings');
        
        const bookings = await response.json();
        renderBookings(bookings);
        
    } catch (error) {
        console.error('Error loading bookings:', error);
        document.getElementById('bookingsContainer').innerHTML = 
            '<p class="empty-state">No bookings yet.</p>';
    }
}

function renderBookings(bookings) {
    const container = document.getElementById('bookingsContainer');
    
    if (!bookings || bookings.length === 0) {
        container.innerHTML = '<p class="empty-state">No bookings yet. Book a hotel above!</p>';
        return;
    }
    
    container.innerHTML = bookings.map(booking => `
        <div class="booking-item">
            <div class="booking-info">
                <h4>${booking.hotel_name}</h4>
                <p>📅 ${formatDate(booking.check_in)} to ${formatDate(booking.check_out)}</p>
                <p>👥 ${booking.num_guests} guests</p>
            </div>
            <div class="booking-amount">
                <strong>₹${Number(booking.amount).toLocaleString()}</strong>
                <span class="booking-status">Confirmed</span>
            </div>
        </div>
    `).join('');
}

// ==================== REVIEW SYSTEM ====================
function setupReviewForm() {
    // Star rating
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            userRating = rating;
            document.getElementById('ratingValue').value = rating;
            
            stars.forEach((s, index) => {
                s.textContent = index < rating ? '★' : '☆';
            });
        });
    });
    
    // Form submission
    const form = document.getElementById('reviewForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!currentDestination || !currentUser) return;
        
        const reviewText = document.getElementById('reviewText').value.trim();
        
        if (userRating === 0) {
            alert('Please select a rating');
            return;
        }
        
        if (!reviewText) {
            alert('Please write a review');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/dashboard/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    user_id: currentUser.id,
                    destination_id: currentDestination.id,
                    review_text: reviewText,
                    rating: userRating
                })
            });
            
            if (!response.ok) throw new Error('Failed to submit review');
            
            alert('✅ Thank you! Your review helps other travelers.');
            
            // Reset form
            form.reset();
            userRating = 0;
            document.querySelectorAll('.star').forEach(s => s.textContent = '☆');
            
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('❌ Failed to submit review. Please try again.');
        }
    });
}

// ==================== MODAL HANDLERS ====================
function setupModalHandlers() {
    document.getElementById('closeModal').addEventListener('click', closeBookingModal);
    document.getElementById('cancelBooking').addEventListener('click', closeBookingModal);
    document.getElementById('confirmBooking').addEventListener('click', confirmBooking);
    document.getElementById('modalBackdrop').addEventListener('click', closeBookingModal);
}

// ==================== UTILITY FUNCTIONS ====================
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Make functions globally accessible
window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuthentication()) return;
    
    setupLogout();
    setupReviewForm();
    setupModalHandlers();
    loadCurrentDestination();
});
