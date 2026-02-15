// =====================================================
// DESTINATION EXPERIENCE PAGE SCRIPT
// Display hotels, tourist spots, itinerary, and transport suggestions
// =====================================================

const API_BASE_URL = 'http://localhost:5000/api';

// State
let currentDestination = null;
let hotels = [];
let spots = [];

// Get destination ID from URL
function getDestinationId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Check authentication
function checkAuthentication() {
    const token = localStorage.getItem('token');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (!token) {
        // Redirect to login if not authenticated
        window.location.href = 'auth.html?mode=login';
        return false;
    }

    // Setup logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }

    return true;
}

// Fetch destination details
async function fetchDestinationDetails() {
    const id = getDestinationId();
    if (!id) {
        showError('No destination selected');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/destinations/${id}`);
        if (!response.ok) throw new Error('Failed to fetch destination');
        
        currentDestination = await response.json();
        renderDestinationHero();
        
        // Fetch related data
        await Promise.all([
            fetchHotels(id),
            fetchTouristSpots(id)
        ]);

        // Generate itinerary
        generateItinerary(currentDestination.category);
    } catch (error) {
        console.error(error);
        showError('Failed to load destination experience');
    }
}

// Fetch hotels for destination
async function fetchHotels(destinationId) {
    try {
        const response = await fetch(`${API_BASE_URL}/hotels/${destinationId}`);
        if (!response.ok) throw new Error('Failed to fetch hotels');
        
        hotels = await response.json();
        renderHotels();
    } catch (error) {
        console.error('Error fetching hotels:', error);
        showNoHotels();
    }
}

// Fetch tourist spots for destination
async function fetchTouristSpots(destinationId) {
    try {
        const response = await fetch(`${API_BASE_URL}/spots/${destinationId}`);
        if (!response.ok) throw new Error('Failed to fetch spots');
        
        spots = await response.json();
        renderTouristSpots();
    } catch (error) {
        console.error('Error fetching spots:', error);
        showNoSpots();
    }
}

// Render destination hero section
function renderDestinationHero() {
    const titleEl = document.getElementById('experienceTitle');
    const subtitleEl = document.getElementById('experienceSubtitle');
    const heroEl = document.getElementById('experienceHero');

    if (titleEl) titleEl.textContent = currentDestination.name || 'Destination';
    if (subtitleEl) subtitleEl.textContent = `Experience ${currentDestination.name} with our expert recommendations`;
    if (heroEl && currentDestination.image_url) {
        heroEl.style.backgroundImage = `url('${currentDestination.image_url}')`;
    }
}

// Render hotels
function renderHotels() {
    const grid = document.getElementById('hotelsGrid');
    if (!grid) return;

    if (!hotels || hotels.length === 0) {
        showNoHotels();
        return;
    }

    grid.innerHTML = hotels.map(hotel => `
        <div class="hotel-card">
            <div class="hotel-image" style="background-image: url('${hotel.image_url || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80'}');"></div>
            <div class="hotel-info">
                <div class="hotel-name">${hotel.name}</div>
                <div class="hotel-rating">⭐ ${(hotel.rating || 4.5).toFixed(1)} / 5.0</div>
                <div class="hotel-price">₹${Math.floor(hotel.price_per_night)}/night</div>
                <div class="hotel-description">${hotel.description || 'Comfortable accommodation for your stay'}</div>
            </div>
        </div>
    `).join('');
}

// Render tourist spots
function renderTouristSpots() {
    const grid = document.getElementById('spotsGrid');
    if (!grid) return;

    if (!spots || spots.length === 0) {
        showNoSpots();
        return;
    }

    grid.innerHTML = spots.map(spot => `
        <div class="spot-card">
            <div class="spot-image" style="background-image: url('${spot.image_url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80'}');"></div>
            <div class="spot-info">
                <div class="spot-name">${spot.name}</div>
                ${spot.category ? `<span class="spot-category">${spot.category}</span>` : ''}
                <div class="spot-description">${spot.description || 'A must-visit location'}</div>
            </div>
        </div>
    `).join('');
}

// Generate itinerary based on category
function generateItinerary(category) {
    const container = document.getElementById('itineraryContainer');
    if (!container) return;

    let itinerary = [];

    if (category === 'Cultural') {
        itinerary = [
            { day: 'Day 1', content: 'Arrive and check-in to your hotel. Spend the afternoon exploring the main temple or monument. Visit local markets for authentic souvenirs and traditional cuisine.' },
            { day: 'Day 2', content: 'Guided tour of secondary cultural sites. Experience local traditions and craftsmanship. Evening: Attend cultural performances or traditional dance shows.' },
            { day: 'Day 3', content: 'Shopping at local bazaars. Spa or wellness treatments. Leisure time at local cafes. Depart or explore nearby villages.' }
        ];
    } else if (category === 'Beach') {
        itinerary = [
            { day: 'Day 1', content: 'Arrive and settle in. Relax at the main beach. Enjoy sunset view and beach-side dinner.' },
            { day: 'Day 2', content: 'Water sports activities: Surfing, paddleboarding, or jet skiing. Explore coral reefs or nearby islands. Beach bonfire and barbecue in the evening.' },
            { day: 'Day 3', content: 'Beach yoga or meditation session. Visit beachside markets. Leisure time or optional boat tours. Depart.' }
        ];
    } else if (category === 'Mountain') {
        itinerary = [
            { day: 'Day 1', content: 'Arrive and acclimatize. Short trek to nearby viewpoint. Sunset viewing and local cuisine.' },
            { day: 'Day 2', content: 'Full-day mountain trek or hiking. Visit valleys and nature reserves. Photography breaks at scenic points.' },
            { day: 'Day 3', content: 'Relaxation day. Visit local villages. Tea/coffee plantation tours if available. Departure.' }
        ];
    } else if (category === 'City') {
        itinerary = [
            { day: 'Day 1', content: 'Arrive and explore city center. Visit main landmarks and monuments. Evening: City lights tour.' },
            { day: 'Day 2', content: 'Museum and gallery visits. Shopping district exploration. Fine dining experience.' },
            { day: 'Day 3', content: 'Local neighborhood walks. Street food tours. Last-minute shopping. Depart.' }
        ];
    } else {
        itinerary = [
            { day: 'Day 1', content: 'Arrive and explore the destination at your own pace. Settle in to your accommodation.' },
            { day: 'Day 2', content: 'Visit popular attractions and landmarks. Engage with local culture and cuisine.' },
            { day: 'Day 3', content: 'Adventure activities or relaxation as per preference. Prepare for departure.' }
        ];
    }

    container.innerHTML = itinerary.map(item => `
        <div class="itinerary-card">
            <div class="itinerary-day">${item.day}</div>
            <div class="itinerary-content">${item.content}</div>
        </div>
    `).join('');
}

// Transportation logic
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication first
    if (!checkAuthentication()) return;

    // Fetch destination data
    fetchDestinationDetails();

    // Setup transport form
    const getTransportBtn = document.getElementById('getTransportBtn');
    const startLocationInput = document.getElementById('startLocation');

    if (getTransportBtn) {
        getTransportBtn.addEventListener('click', () => {
            const startLocation = startLocationInput.value.trim();
            if (!startLocation) {
                alert('Please enter your starting location');
                return;
            }
            suggestTransportation(startLocation);
        });
    }

    // Enter key support
    if (startLocationInput) {
        startLocationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                getTransportBtn.click();
            }
        });
    }
});

// Suggest transportation based on start location
function suggestTransportation(startLocation) {
    const destName = currentDestination.name || '';
    const destCountry = currentDestination.country || 'India';
    const result = document.getElementById('transportResult');

    if (!result) return;

    // Show loading state
    result.innerHTML = '<div class="transport-info">Analyzing transportation options... <span class="loading-spinner"></span></div>';
    result.classList.add('show');

    // Simulate processing
    setTimeout(() => {
        let suggestion = '';
        const startLower = startLocation.toLowerCase();

        if (destCountry.toLowerCase() === 'india') {
            if (startLower === 'delhi' || startLower === 'd.l' || startLower === 'new delhi') {
                if (destName.includes('Goa')) {
                    suggestion = `
                        <div class="transport-mode">✈️ Flight (Recommended)</div>
                        <div class="transport-info">• Distance: ~1600 km</div>
                        <div class="transport-info">• Duration: 2.5 - 3 hours flight + transfers</div>
                        <div class="transport-info">• Estimated Cost: ₹4,000 - ₹8,000 (economy)</div>
                        <div class="transport-info">• Option 2: Train (₹1,500-3000, 16-20 hours)</div>
                    `;
                } else if (destName.includes('Ooty') || destName.includes('Kodaikanal')) {
                    suggestion = `
                        <div class="transport-mode">✈️ Flight or Train</div>
                        <div class="transport-info">• Distance: ~2000 km</div>
                        <div class="transport-info">• Flight Duration: 3 hours + transfers</div>
                        <div class="transport-info">• Train Duration: 18-24 hours</div>
                        <div class="transport-info">• Flight Cost: ₹5,000 - ₹9,000</div>
                        <div class="transport-info">• Train Cost: ₹2,000 - ₹5,000</div>
                    `;
                } else {
                    suggestion = `
                        <div class="transport-mode">🚂 Train or 🚗 Car</div>
                        <div class="transport-info">• Train is economical for long distances</div>
                        <div class="transport-info">• Car rental: ₹1,500-2,500/day</div>
                        <div class="transport-info">• Bus: ₹500-1,500 (budget-friendly)</div>
                    `;
                }
            } else if (startLower === 'bangalore' || startLower === 'bengaluru') {
                if (destName.includes('Ooty')) {
                    suggestion = `
                        <div class="transport-mode">🚗 Car or Bus</div>
                        <div class="transport-info">• Distance: ~140 km</div>
                        <div class="transport-info">• Car: 3-4 hours, ₹2,000-3,000</div>
                        <div class="transport-info">• Bus: 2.5-3 hours, ₹300-500</div>
                        <div class="transport-info">• Recommendation: Road trip with scenic stops</div>
                    `;
                } else {
                    suggestion = `
                        <div class="transport-mode">🚗 Car</div>
                        <div class="transport-info">• Recommended for nearby hill stations</div>
                        <div class="transport-info">• Car rental: ₹2,000/day</div>
                        <div class="transport-info">• Bus: Budget-friendly alternative</div>
                    `;
                }
            } else {
                suggestion = `
                    <div class="transport-mode">🚍 Public Transport</div>
                    <div class="transport-info">• Check local bus services</div>
                    <div class="transport-info">• Train availability depends on location</div>
                    <div class="transport-info">• Flight: For destinations > 1500 km</div>
                    <div class="transport-info">• Car rental: Recommended for flexibility</div>
                `;
            }
        } else {
            suggestion = `
                <div class="transport-mode">✈️ International Travel</div>
                <div class="transport-info">• International flight required</div>
                <div class="transport-info">• Check visa requirements</div>
                <div class="transport-info">• Budget: ₹15,000 - ₹50,000+ depending on destination</div>
            `;
        }

        result.innerHTML = suggestion + `
            <div class="transport-info" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(74, 144, 226, 0.2);">
                💡 <strong>Tip:</strong> Book in advance for better deals. Consider traveling during off-peak seasons for discounts.
            </div>
        `;
    }, 800);
}

// Error handling
function showError(message) {
    const container = document.getElementById('spotsGrid');
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <p>${message}</p>
            </div>
        `;
    }
}

function showNoHotels() {
    const grid = document.getElementById('hotelsGrid');
    if (grid) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏨</div>
                <p>No hotels available for this destination yet.</p>
            </div>
        `;
    }
}

function showNoSpots() {
    const grid = document.getElementById('spotsGrid');
    if (grid) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📍</div>
                <p>No tourist spots listed for this destination yet.</p>
            </div>
        `;
    }
}
