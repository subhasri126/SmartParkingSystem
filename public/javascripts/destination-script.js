// =====================================================
// DESTINATION DETAILS PAGE SCRIPT
// Fetch and render destination details by ID
// =====================================================

const API_BASE_CANDIDATES = (() => {
    const bases = [];
    const origin = window.location.origin;
    if (origin && origin.startsWith("http")) {
        bases.push(`${origin}/api`);
    }
    bases.push("http://localhost:3000/api");
    bases.push("http://127.0.0.1:3000/api");
    bases.push("http://localhost:3001/api");
    bases.push("http://127.0.0.1:3001/api");
    return [...new Set(bases)];
})();
const LOGIN_STATE_KEY = "userLoggedIn";

const AUTH_API_BASES = (() => {
    const bases = [];
    const origin = window.location.origin;
    if (origin && origin.startsWith("http")) {
        bases.push(`${origin}/api/auth`);
    }
    bases.push("http://localhost:3000/api/auth");
    bases.push("http://127.0.0.1:3000/api/auth");
    return [...new Set(bases)];
})();

let isAuthenticated = false;
let hasExploreDataLoaded = false;
let activeApiBase = null;

const DESTINATION_PARKING_FACILITIES = {
    1: [
        { name: 'Taj Mahal Parking Lot A', distance: '200 meters away' },
        { name: 'Taj East Gate Car Park', distance: '450 meters away' }
    ],
    2: [
        { name: 'Goa Beach Parking Hub B', distance: '300 meters away' },
        { name: 'Goa Coastal Multi-Level Parking', distance: '700 meters away' }
    ],
    3: [
        { name: 'Ooty Lake Parking C', distance: '250 meters away' },
        { name: 'Doddabetta Base Parking', distance: '900 meters away' }
    ]
};

function renderParkingFacilities(destinationId, availableCount = null) {
    const facilitiesEl = document.getElementById('parkingFacilities');
    if (!facilitiesEl) return;

    const facilities = DESTINATION_PARKING_FACILITIES[Number(destinationId)] || [];
    if (facilities.length === 0) {
        facilitiesEl.innerHTML = '';
        return;
    }

    facilitiesEl.innerHTML = facilities.map((facility) => {
        const slotsText = Number.isFinite(availableCount)
            ? `${availableCount} available slots`
            : 'Live slot count visible after login';

        return `
            <article class="parking-facility-card">
                <h4 class="parking-facility-name">${facility.name}</h4>
                <p class="parking-facility-meta">${facility.distance}</p>
                <p class="parking-facility-meta">${slotsText}</p>
            </article>
        `;
    }).join('');
}

function setParkingVisibilityForAuthState(destinationId) {
    const notice = document.getElementById('parkingLoginNotice');
    const summary = document.getElementById('parkingSummary');
    const grid = document.getElementById('parkingSlotsGrid');
    const messageBox = document.getElementById('parkingReserveMessage');

    if (!summary || !grid) return;

    if (!isAuthenticated) {
        if (notice) notice.style.display = 'block';
        summary.textContent = 'Please login to view parking slots.';
        grid.innerHTML = '';
        if (messageBox) messageBox.innerHTML = '';
        renderParkingFacilities(destinationId, null);
        return;
    }

    if (notice) notice.style.display = 'none';
}

function hasLocalLoginState() {
    const explicit = localStorage.getItem(LOGIN_STATE_KEY) === "true";
    const legacy = localStorage.getItem("voyago_is_logged_in") === "true";
    const token = localStorage.getItem("token") || localStorage.getItem("voyago_token");
    return explicit || legacy || Boolean(token);
}

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

function updateNavbarAuth() {
    const navMenu = document.querySelector(".nav-menu");
    if (!navMenu) return;

    if (isAuthenticated) {
        navMenu.innerHTML = `
            <li><a href="index.html" class="nav-link">Home</a></li>
            <li><a href="explore.html" class="nav-link">Explore</a></li>
            <li><a href="analytics.html" class="nav-link">Analytics</a></li>
            <li><a href="about.html" class="nav-link">About</a></li>
            <li><a href="#parkingBlock" class="nav-link">Parking Availability</a></li>
            <li><button id="logoutBtn" class="nav-link btn-login" type="button">Logout</button></li>
        `;

        const logoutBtn = navMenu.querySelector('#logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await logoutCurrentUser();
                window.location.href = 'index.html';
            });
        }
        return;
    }

    navMenu.innerHTML = `
        <li><a href="index.html" class="nav-link">Home</a></li>
        <li><a href="explore.html" class="nav-link">Explore</a></li>
        <li><a href="analytics.html" class="nav-link">Analytics</a></li>
        <li><a href="about.html" class="nav-link">About</a></li>
        <li><a href="auth.html" class="nav-link btn-login">Login</a></li>
        <li><a href="auth.html" class="nav-link btn-register">Register</a></li>
    `;
}

async function authFetch(path, options = {}) {
    let lastError;
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    for (const base of AUTH_API_BASES) {
        try {
            const response = await fetch(`${base}${normalizedPath}`, {
                credentials: "include",
                ...options
            });

            const contentType = response.headers.get("content-type") || "";
            if (!response.ok && !contentType.includes("application/json")) {
                throw new Error(`Invalid auth response (${response.status})`);
            }

            return response;
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error("Auth service unavailable");
}

async function apiFetch(path, options = {}) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const candidates = activeApiBase
        ? [activeApiBase, ...API_BASE_CANDIDATES.filter((base) => base !== activeApiBase)]
        : API_BASE_CANDIDATES;

    let lastError;

    for (const base of candidates) {
        try {
            const response = await fetch(`${base}${normalizedPath}`, {
                credentials: "include",
                ...options
            });

            const contentType = response.headers.get("content-type") || "";
            if (!response.ok && !contentType.includes("application/json")) {
                throw new Error(`Invalid API response (${response.status})`);
            }

            activeApiBase = base;
            return response;
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error("API unavailable");
}

async function checkLoginState() {
    const localState = hasLocalLoginState();

    try {
        const response = await authFetch("/session");
        const data = await response.json();
        isAuthenticated = Boolean(data?.authenticated) || localState;
    } catch (error) {
        isAuthenticated = localState;
    }

    if (isAuthenticated) {
        localStorage.setItem(LOGIN_STATE_KEY, "true");
        localStorage.setItem("voyago_is_logged_in", "true");
    }

    updateNavbarAuth();
    return isAuthenticated;
}

async function logoutCurrentUser() {
    try {
        await authFetch("/logout", { method: "POST" });
    } catch (error) {
        console.warn("Session logout failed", error);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("voyago_token");
    localStorage.removeItem("voyago_user");
    localStorage.removeItem("voyago_is_logged_in");
    localStorage.removeItem(LOGIN_STATE_KEY);
    localStorage.removeItem("voyago_login_at");
}

async function showExploreSections(shouldScroll = true, forceReload = false) {
    const section = document.getElementById("exploreSections");
    if (!section) return;

    section.style.display = "block";
    const destinationId = getDestinationId();
    if (destinationId && (!hasExploreDataLoaded || forceReload)) {
        await loadExploreData(destinationId);
        hasExploreDataLoaded = true;
    }

    if (shouldScroll) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function toggleExploreSections() {
    // Check authentication first
    const destinationId = getDestinationId();
    
    if (!isAuthenticated) {
        // User not logged in - store return URL and redirect with notice
        sessionStorage.setItem('selectedDestinationId', destinationId);
        sessionStorage.setItem('redirectAfterLogin', `destination.html?id=${destinationId}&autoExplore=1`);
        sessionStorage.setItem('authNotice', 'Please login to explore this destination.');
        window.location.href = "auth.html?mode=login";
        return;
    }

    // User is logged in - show destination sections in-place
    showExploreSections(true, true);
}

async function fetchDestination() {
    const id = getDestinationId();
    if (!id) {
        renderError("Missing destination ID.");
        return;
    }

    try {
        const response = await apiFetch(`/destinations/${id}`);
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
    const hotelsGrid = document.getElementById("hotelsGrid");
    const spotsGrid = document.getElementById("spotsGrid");
    const itineraryContainer = document.getElementById("itineraryContainer");
    const transportResults = document.getElementById("transportResults");

    if (hotelsGrid) hotelsGrid.innerHTML = '<div class="loading-state">Loading hotels...</div>';
    if (spotsGrid) spotsGrid.innerHTML = '<div class="loading-state">Loading tourist spots...</div>';
    if (itineraryContainer) itineraryContainer.innerHTML = '<div class="loading-state">Generating itinerary...</div>';
    if (transportResults) transportResults.innerHTML = '<div class="loading-state">Loading transport options...</div>';

    await Promise.all([
        fetchHotels(destinationId),
        fetchTouristSpots(destinationId),
        fetchDestinationParking(destinationId)
    ]);
    generateItinerary();
    renderTransportOverview();
}

async function fetchDestinationParking(destinationId) {
    const grid = document.getElementById("parkingSlotsGrid");
    const summary = document.getElementById("parkingSummary");
    const messageBox = document.getElementById("parkingReserveMessage");
    const qrCard = document.getElementById('parkingQrCard');

    if (!grid || !summary) return;
    if (messageBox) messageBox.innerHTML = "";
    if (qrCard) qrCard.style.display = 'none';

    setParkingVisibilityForAuthState(destinationId);
    if (!isAuthenticated) {
        return;
    }

    try {
        const response = await apiFetch(`/parking/destination/${destinationId}/slots`);
        if (!response.ok) throw new Error("Failed to fetch destination parking slots");

        const payload = await response.json();
        const slots = Array.isArray(payload?.data) ? payload.data : [];
        const stats = payload?.summary || {
            total: slots.length,
            available: slots.filter((s) => s.status === "available").length,
            occupied: slots.filter((s) => s.status === "occupied").length,
            reserved: slots.filter((s) => s.status === "reserved").length
        };

        renderParkingFacilities(destinationId, Number(stats.available));

        summary.textContent = `Total: ${stats.total} | Available: ${stats.available} | Occupied: ${stats.occupied} | Reserved: ${stats.reserved}`;

        if (slots.length === 0) {
            grid.innerHTML = '<p class="empty-state">No data available for this section.</p>';
            return;
        }

        grid.innerHTML = slots.map((slot) => {
            const status = String(slot.status || "available").toLowerCase();
            const canReserve = status === "available";
            return `
                <div class="parking-slot-card ${status}" ${canReserve ? `data-slot-id="${slot.id}"` : ''}>
                    <div class="parking-slot-head">
                        <span class="parking-slot-number">${slot.slot_number}</span>
                        <span class="parking-slot-status ${status}">${status}</span>
                    </div>
                    <button class="btn btn-primary" type="button" data-slot-id="${slot.id}" ${canReserve ? "" : "disabled"}>
                        ${canReserve ? "Reserve Parking" : "Unavailable"}
                    </button>
                </div>
            `;
        }).join("");

        grid.querySelectorAll("button[data-slot-id]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const slotId = btn.getAttribute("data-slot-id");
                reserveDestinationParking(destinationId, slotId);
            });
        });

        // Allow card click for available slots to match one-click booking flow.
        grid.querySelectorAll(".parking-slot-card[data-slot-id]").forEach((card) => {
            card.style.cursor = 'pointer';
            card.addEventListener("click", (event) => {
                if (event.target.closest('button')) {
                    return;
                }
                const slotId = card.getAttribute("data-slot-id");
                reserveDestinationParking(destinationId, slotId);
            });
        });
    } catch (error) {
        console.error("Error fetching destination parking:", error);
        summary.textContent = "Parking availability is currently unavailable.";
        grid.innerHTML = '<p class="empty-state">No data available for this section.</p>';
    }
}

async function reserveDestinationParking(destinationId, slotId) {
    const messageBox = document.getElementById("parkingReserveMessage");
    const qrCard = document.getElementById('parkingQrCard');
    const qrImage = document.getElementById('parkingQrImage');
    const qrMeta = document.getElementById('parkingQrMeta');
    const token = localStorage.getItem("token") || localStorage.getItem("voyago_token");

    if (!isAuthenticated && !token) {
        sessionStorage.setItem("selectedDestinationId", destinationId);
        sessionStorage.setItem("redirectAfterLogin", `destination.html?id=${destinationId}&autoExplore=1`);
        sessionStorage.setItem("authNotice", "Please login to reserve parking for this destination.");
        window.location.href = "auth.html?mode=login";
        return;
    }

    try {
        const response = await apiFetch(`/parking/destination/${destinationId}/reserve/${slotId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ duration_hours: 2 })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to reserve parking slot");
        }

        if (messageBox) {
            const bookingRefText = data.data.booking_ref || `#${data.data.booking_id}`;
            messageBox.innerHTML = `<div class="transport-option"><div class="transport-mode">✅ Reservation Confirmed</div><p class="transport-note">Slot ${data.data.slot_number} reserved successfully. Booking: ${bookingRefText}</p></div>`;
        }

        if (qrCard && qrImage && qrMeta && data?.data?.qr_code_data_url) {
            qrMeta.textContent = `Booking ${data.data.booking_ref || data.data.booking_id} | Slot ${data.data.slot_number} | Destination ${data.data.destination_id}`;
            qrImage.src = data.data.qr_code_data_url;
            qrCard.style.display = 'block';
        }

        await fetchDestinationParking(destinationId);
    } catch (error) {
        console.error("Reserve destination parking error:", error);
        if (messageBox) {
            messageBox.innerHTML = `<p class="warning-state">${error.message || "Unable to reserve slot."}</p>`;
        }
    }
}

// Fetch hotels
async function fetchHotels(destinationId) {
    const grid = document.getElementById("hotelsGrid");
    if (!grid) return;

    try {
        const response = await apiFetch(`/hotels/${destinationId}`);
        if (!response.ok) throw new Error("Failed to fetch hotels");

        const hotels = await response.json();
        const list = Array.isArray(hotels) ? hotels : [];
        
        if (list.length === 0) {
            grid.innerHTML = '<p class="empty-state">No data available for this section.</p>';
            return;
        }
        
        grid.innerHTML = list.map(hotel => `
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
        grid.innerHTML = '<p class="empty-state">No data available for this section.</p>';
    }
}

// Fetch tourist spots
async function fetchTouristSpots(destinationId) {
    const grid = document.getElementById("spotsGrid");
    if (!grid) return;

    try {
        const response = await apiFetch(`/spots/${destinationId}`);
        if (!response.ok) throw new Error("Failed to fetch tourist spots");

        const spots = await response.json();
        const list = Array.isArray(spots) ? spots : [];
        
        if (list.length === 0) {
            grid.innerHTML = '<p class="empty-state">No data available for this section.</p>';
            return;
        }
        
        grid.innerHTML = list.map(spot => `
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
        grid.innerHTML = '<p class="empty-state">No data available for this section.</p>';
    }
}

// Generate itinerary based on category
function generateItinerary() {
    const container = document.getElementById("itineraryContainer");
    if (!container) return;

    if (!currentDestinationData) {
        container.innerHTML = '<p class="empty-state">No data available for this section.</p>';
        return;
    }
    
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

function renderTransportOverview() {
    const results = document.getElementById("transportResults");
    if (!results) return;

    if (!currentDestinationData) {
        results.innerHTML = '<p class="empty-state">No data available for this section.</p>';
        return;
    }

    const destinationName = currentDestinationData.name || "this destination";
    const destinationState = currentDestinationData.state || currentDestinationData.country || "India";
    const category = String(currentDestinationData.category || "").toLowerCase();

    let suggestions;
    if (category.includes("beach")) {
        suggestions = [
            { mode: "✈️ Flight + Cab", time: "Fastest", note: `Nearest airport transfer to ${destinationName}` },
            { mode: "🚂 Train", time: "Moderate", note: "Great for budget and comfort" },
            { mode: "🚌 Bus", time: "Budget", note: "Frequent intercity options" }
        ];
    } else if (category.includes("mountain") || category.includes("hill")) {
        suggestions = [
            { mode: "🚂 Train + Taxi", time: "Moderate", note: "Reliable route for hill destinations" },
            { mode: "🚗 Self Drive", time: "Flexible", note: "Best for scenic stopovers" },
            { mode: "🚌 Bus", time: "Budget", note: "Regular state transport options" }
        ];
    } else {
        suggestions = [
            { mode: "✈️ Flight", time: "Fastest", note: `Quick access to ${destinationName}` },
            { mode: "🚂 Train", time: "Comfort", note: "Good balance of cost and travel time" },
            { mode: "🚌 Bus / Cab", time: "Flexible", note: `Road connectivity across ${destinationState}` }
        ];
    }

    results.innerHTML = `
        <h4 class="transport-title">Transport Options for ${destinationName}</h4>
        <div class="transport-options">
            ${suggestions.map((s) => `
                <div class="transport-option">
                    <div class="transport-mode">${s.mode}</div>
                    <div class="transport-details">
                        <span class="transport-time">⏱️ ${s.time}</span>
                    </div>
                    <p class="transport-note">${s.note}</p>
                </div>
            `).join("")}
        </div>
    `;
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

document.addEventListener("DOMContentLoaded", async () => {
    await checkLoginState();
    await fetchDestination();
    setupActionButtons();
    await showExploreSections(false);

    const params = new URLSearchParams(window.location.search);
    if (params.get("autoExplore") === "1" && isAuthenticated) {
        localStorage.setItem(LOGIN_STATE_KEY, "true");
        await showExploreSections(true);
    }
});
