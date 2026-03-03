// =====================================================
// DESTINATION DETAILS PAGE SCRIPT
// Fetch and render destination details by ID
// =====================================================

const API_BASE_URL = "http://localhost:3000/api";

function getDestinationId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

function formatPrice(price) {
    return Number(price || 0).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

function setHeroImage(url) {
    const hero = document.getElementById("destinationImage");
    if (hero) {
        const defaultImage = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80";
        const imgTest = new Image();
        imgTest.src = url;
        
        imgTest.onload = () => {
            hero.style.backgroundImage = `url('${url}')`;
        };
        
        imgTest.onerror = () => {
            hero.style.backgroundImage = `url('${defaultImage}')`;
        };
    }
}

function renderDestination(destination) {
    currentDestinationData = destination;
    
    const nameEl = document.getElementById("destinationName");
    const countryEl = document.getElementById("destinationCountry");
    const ratingEl = document.getElementById("destinationRating");
    const priceEl = document.getElementById("destinationPrice");
    const descEl = document.getElementById("destinationDescription");

    if (nameEl) nameEl.textContent = destination.name || "Destination";
    if (countryEl) countryEl.textContent = destination.state || destination.country || "India";
    if (ratingEl) ratingEl.textContent = Number(destination.rating || 0).toFixed(1);
    if (priceEl) priceEl.textContent = `₹${formatPrice(destination.average_budget || destination.price_starting)}`;
    if (descEl) descEl.textContent = destination.description || "";

    if (destination.image_url) {
        setHeroImage(destination.image_url);
    }

    // Populate additional fields
    const locationEl = document.getElementById("destinationLocationInfo");
    const categoryEl = document.getElementById("destinationCategory");
    const continentEl = document.getElementById("destinationContinent");
    const ratingFullEl = document.getElementById("destinationRatingFull");

    if (locationEl) locationEl.textContent = `${destination.name}, ${destination.state || destination.country || 'India'}`;
    if (categoryEl) categoryEl.textContent = destination.category || "—";
    if (continentEl) continentEl.textContent = destination.state || "India";
    if (ratingFullEl) ratingFullEl.textContent = Number(destination.rating || 0).toFixed(1);

    // Update page title
    document.title = `${destination.name} - Voyago`;
}

function renderError(message) {
    const descEl = document.getElementById("destinationDescription");
    if (descEl) {
        descEl.textContent = message;
    }
}

// State management
let currentDestinationData = null;

function setupActionButtons() {
    const backBtn = document.getElementById("backBtn");
    const bookNowBtn = document.getElementById("bookNowBtn");

    if (backBtn) {
        backBtn.addEventListener("click", () => {
            window.location.href = "explore.html";
        });
    }

    if (bookNowBtn) {
        bookNowBtn.addEventListener("click", () => {
            toggleExploreSections();
        });
    }

    // Setup transport button
    const transportBtn = document.getElementById("suggestTransportBtn");
    if (transportBtn) {
        transportBtn.addEventListener("click", suggestTransportation);
    }
}

function toggleExploreSections() {
    // Check authentication first
    const token = localStorage.getItem('token');
    const destinationId = getDestinationId();
    
    if (!token) {
        // User not logged in - store destination ID and redirect to login
        sessionStorage.setItem('selectedDestinationId', destinationId);
        sessionStorage.setItem('redirectAfterLogin', 'app/home/');
        window.location.href = "auth.html?mode=login";
        return;
    }
    
    // User is logged in - redirect to dashboard with destination ID
    sessionStorage.setItem('selectedDestinationId', destinationId);
    window.location.href = "app/home/";
}

async function fetchDestination() {
    const id = getDestinationId();
    if (!id) {
        renderError("Missing destination ID.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/destinations/${id}`);
        if (!response.ok) {
            throw new Error("Failed to fetch destination");
        }

        const data = await response.json();
        renderDestination(data);
    } catch (error) {
        console.error(error);
        renderError("Failed to load destination details.");
    }
}

// Load explore data (hotels, spots, itinerary)
async function loadExploreData(destinationId) {
    await Promise.all([
        fetchHotels(destinationId),
        fetchTouristSpots(destinationId)
    ]);
    generateItinerary();
}

// Fetch hotels
async function fetchHotels(destinationId) {
    const grid = document.getElementById("hotelsGrid");
    try {
        const response = await fetch(`${API_BASE_URL}/hotels/${destinationId}`);
        const hotels = await response.json();
        
        if (hotels.length === 0) {
            grid.innerHTML = '<p class="empty-state">No hotels available for this destination yet.</p>';
            return;
        }
        
        grid.innerHTML = hotels.map(hotel => `
            <div class="hotel-card">
                <div class="hotel-image" style="background-image: url('${hotel.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80'}');"></div>
                <div class="hotel-info">
                    <h3 class="hotel-name">${hotel.name}</h3>
                    <div class="hotel-rating">⭐ ${Number(hotel.rating || 0).toFixed(1)}</div>
                    <p class="hotel-desc">${hotel.description || ''}</p>
                    <div class="hotel-price">₹${Number(hotel.price_per_night || 0).toLocaleString()}/night</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error fetching hotels:', error);
        grid.innerHTML = '<p class="error-state">Failed to load hotels.</p>';
    }
}

// Fetch tourist spots
async function fetchTouristSpots(destinationId) {
    const grid = document.getElementById("spotsGrid");
    try {
        const response = await fetch(`${API_BASE_URL}/spots/${destinationId}`);
        const spots = await response.json();
        
        if (spots.length === 0) {
            grid.innerHTML = '<p class="empty-state">No tourist spots available yet.</p>';
            return;
        }
        
        grid.innerHTML = spots.map(spot => `
            <div class="spot-card">
                <div class="spot-image" style="background-image: url('${spot.image_url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80'}');"></div>
                <div class="spot-info">
                    <div class="spot-header">
                        <h3 class="spot-name">${spot.name}</h3>
                        <span class="spot-category">${spot.category || 'Attraction'}</span>
                    </div>
                    <p class="spot-desc">${spot.description || ''}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error fetching spots:', error);
        grid.innerHTML = '<p class="error-state">Failed to load tourist spots.</p>';
    }
}

// Generate itinerary based on category
function generateItinerary() {
    const container = document.getElementById("itineraryContainer");
    if (!currentDestinationData) return;
    
    const category = (currentDestinationData.category || '').toLowerCase();
    let itinerary = [];
    
    if (category.includes('beach')) {
        itinerary = [
            { day: 1, title: 'Beach Arrival', activities: ['Check-in to hotel', 'Relax at the beach', 'Enjoy sunset by the shore', 'Dinner at beachside restaurant'] },
            { day: 2, title: 'Water Adventures', activities: ['Morning water sports (surfing, jet ski)', 'Island hopping tour', 'Snorkeling or diving', 'Beach bonfire evening'] }
        ];
    } else if (category.includes('cultural') || category.includes('historic')) {
        itinerary = [
            { day: 1, title: 'Heritage Exploration', activities: ['Visit main monument/palace', 'Explore old city streets', 'Attend cultural performance', 'Traditional dinner'] },
            { day: 2, title: 'Local Experience', activities: ['Visit local museums', 'Shop at traditional markets', 'Temple or historic site tour', 'Local cuisine tasting'] }
        ];
    } else if (category.includes('mountain') || category.includes('hill')) {
        itinerary = [
            { day: 1, title: 'Mountain Arrival', activities: ['Acclimatization walk', 'Visit nearby viewpoints', 'Explore local village', 'Cozy mountain dinner'] },
            { day: 2, title: 'Adventure Day', activities: ['Trekking to scenic spots', 'Photography at peaks', 'Visit waterfalls or lakes', 'Campfire evening'] }
        ];
    } else if (category.includes('city') || category.includes('urban')) {
        itinerary = [
            { day: 1, title: 'City Highlights', activities: ['Visit iconic landmarks', 'Explore downtown area', 'Shopping at city malls', 'Night city lights tour'] },
            { day: 2, title: 'Culture & Cuisine', activities: ['Museum visits', 'Local neighborhood walk', 'Street food tour', 'Entertainment district'] }
        ];
    } else {
        itinerary = [
            { day: 1, title: 'Arrival & Exploration', activities: ['Check-in and freshen up', 'Visit main attractions', 'Local market visit', 'Try local cuisine'] },
            { day: 2, title: 'Full Day Experience', activities: ['Morning sightseeing', 'Adventure activities', 'Relaxation time', 'Evening entertainment'] }
        ];
    }
    
    container.innerHTML = itinerary.map(day => `
        <div class="itinerary-day">
            <div class="day-header">
                <div class="day-number">Day ${day.day}</div>
                <h3 class="day-title">${day.title}</h3>
            </div>
            <ul class="day-activities">
                ${day.activities.map(activity => `<li>${activity}</li>`).join('')}
            </ul>
        </div>
    `).join('');
}

// Suggest transportation
function suggestTransportation() {
    const input = document.getElementById("startLocationInput");
    const results = document.getElementById("transportResults");
    const startLocation = input.value.trim().toLowerCase();
    
    if (!startLocation) {
        results.innerHTML = '<p class="warning-state">Please enter your starting location.</p>';
        return;
    }
    
    if (!currentDestinationData) return;
    
    const destName = currentDestinationData.name.toLowerCase();
    const destCountry = currentDestinationData.country.toLowerCase();
    
    let suggestions = [];
    
    // Check if same country/nearby
    const indianCities = ['mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'pune', 'ahmedabad'];
    const isIndianStart = indianCities.some(city => startLocation.includes(city));
    const isIndianDest = destCountry.includes('india');
    
    if (isIndianStart && isIndianDest) {
        // Within India
        if (startLocation.includes('mumbai') && (destName.includes('goa') || destName.includes('pune'))) {
            suggestions = [
                { mode: '🚗 Car/Taxi', time: '4-6 hours', cost: '₹2,500-4,000', note: 'Most convenient, scenic route' },
                { mode: '🚂 Train', time: '8-10 hours', cost: '₹500-1,500', note: 'Comfortable overnight journey' },
                { mode: '🚌 Bus', time: '6-8 hours', cost: '₹400-800', note: 'Budget-friendly option' }
            ];
        } else if (startLocation.includes('bangalore') && (destName.includes('ooty') || destName.includes('coorg'))) {
            suggestions = [
                { mode: '🚗 Car/Taxi', time: '5-6 hours', cost: '₹3,000-5,000', note: 'Flexible and scenic' },
                { mode: '🚌 Bus', time: '6-7 hours', cost: '₹500-1,000', note: 'Regular services available' }
            ];
        } else {
            // Default India suggestions
            suggestions = [
                { mode: '✈️ Flight', time: '1-3 hours', cost: '₹3,000-8,000', note: 'Fastest option' },
                { mode: '🚂 Train', time: '8-24 hours', cost: '₹800-3,000', note: 'Comfortable and affordable' },
                { mode: '🚌 Bus', time: '10-20 hours', cost: '₹600-1,500', note: 'Budget option' }
            ];
        }
    } else if (!isIndianStart && !isIndianDest) {
        // International
        suggestions = [
            { mode: '✈️ International Flight', time: 'Varies', cost: '$200-1,500', note: 'Check connecting flights' },
            { mode: '🚂 Train/Rail', time: 'If available', cost: 'Varies', note: 'Regional rail networks' }
        ];
    } else {
        // Mixed or unclear
        suggestions = [
            { mode: '✈️ Flight', time: '2-8 hours', cost: '₹5,000-50,000', note: 'International travel required' },
            { mode: '🚗 Car Rental', time: 'Varies', cost: '₹2,000-5,000/day', note: 'Local exploration' }
        ];
    }
    
    results.innerHTML = `
        <h4 class="transport-title">From ${input.value} to ${currentDestinationData.name}:</h4>
        <div class="transport-options">
            ${suggestions.map(s => `
                <div class="transport-option">
                    <div class="transport-mode">${s.mode}</div>
                    <div class="transport-details">
                        <span class="transport-time">⏱️ ${s.time}</span>
                        <span class="transport-cost">💰 ${s.cost}</span>
                    </div>
                    <p class="transport-note">${s.note}</p>
                </div>
            `).join('')}
        </div>
    `;
}

document.addEventListener("DOMContentLoaded", () => {
    fetchDestination();
    setupActionButtons();
    
});
