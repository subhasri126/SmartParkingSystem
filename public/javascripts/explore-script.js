// =====================================================
// EXPLORE PAGE SCRIPTS - API INTEGRATED
// Filtering, animations, and interactions with backend
// =====================================================

// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// State management (Simulating useState)
let destinations = [];
let isLoading = true;
let error = null;
let availableParkingSlots = 0;

// Fetch available parking count
async function fetchParkingAvailability() {
    try {
        const response = await fetch(`${API_BASE_URL}/parking/available-count`);
        if (!response.ok) throw new Error('Failed to fetch parking');
        const result = await response.json();
        if (result.success) {
            availableParkingSlots = result.availableSlots;
        }
    } catch (err) {
        console.error('Error fetching parking availability:', err);
        availableParkingSlots = 0;
    }
}

// Simulating useEffect to fetch destinations when component loads
document.addEventListener('DOMContentLoaded', function () {
    // Initialize the page
    console.log('Explore page initialized');

    // Fetch parking availability
    fetchParkingAvailability();

    // Fetch destinations just like useEffect(() => { fetch... }, [])
    fetchDestinations();

    // Advanced search setup (with debounce)
    setupAdvancedSearch();

    // Filter functionality setup
    setupFilters();

    // UI Interactions
    setupInteractions();
    
    // Refresh parking availability every 10 seconds
    setInterval(fetchParkingAvailability, 10000);
});

// 1) & 2) Fetch destinations from API
const fetchDestinations = async (params = {}) => {
    // 3) Show loading spinner
    setLoading(true);
    setError(null);

    try {
        const queryParams = new URLSearchParams(params);
        const url = queryParams.toString()
            ? `http://localhost:3000/api/destinations?${queryParams.toString()}`
            : "http://localhost:3000/api/destinations";

        console.log('Fetching destinations from:', url);

        // 5) Parse JSON properly
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Failed to fetch");
        }

        const data = await response.json();

        // 10) Add console.log(data) to verify API response
        console.log('Fetched data:', data);

        // 6) Store data in state
        destinations = data;

        // Render after state update
        renderDestinations();
        setLoading(false);

    } catch (err) {
        // 4) Handle errors correctly
        console.error(err);
        setError("Failed to load destinations");
        setLoading(false);
        renderError();
    }
}

// Helper to update loading state and UI
function setLoading(loading) {
    isLoading = loading;
    if (isLoading) {
        showLoadingState();
    }
}

// Helper to update error state
function setError(err) {
    error = err;
}

// 7) Render destination cards dynamically
function renderDestinations() {
    const grid = document.getElementById('destinationsGrid');
    if (!grid) return;

    // Clear existing content
    grid.innerHTML = '';

    if (!Array.isArray(destinations) || destinations.length === 0) {
        showNoResults();
        return;
    }

    // Map through destinations and create cards
    destinations.forEach(destination => {
        // Ensure backend data maps to UI
        const card = document.createElement('div');
        card.className = 'destination-card';

        // Construct styles and attributes based on data
        const state = (destination.state || 'India').toLowerCase().replace(/\s+/g, '-');
        const category = (destination.category || 'other').toLowerCase().replace(/\s+/g, '-');
        const budget = getBudgetCategory(destination.average_budget || destination.price_starting);

        card.setAttribute('data-state', state);
        card.setAttribute('data-budget', budget);
        card.setAttribute('data-type', category);

        const badge = destination.is_featured ? 'Featured' :
            (destination.rating >= 4.8 ? 'Popular' : '');

        const badgeHTML = badge ? `<div class="destination-badge">${badge}</div>` : '';

        card.innerHTML = `
            <div class="destination-image" style="background-image: url('${destination.image_url}'), linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%);">
                ${badgeHTML}
                <img src="${destination.image_url}" alt="${destination.name}" style="display: none;" onerror="this.parentElement.style.backgroundImage = 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)';">
            </div>
            <div class="destination-content">
                <div class="destination-header">
                    <h3 class="destination-name">${destination.name}, ${destination.state || 'India'}</h3>
                    <div class="destination-rating">
                        <span class="rating-star">⭐</span>
                        <span class="rating-value">${Number(destination.rating || 0).toFixed(1)}</span>
                    </div>
                </div>
                <p class="destination-description">${truncateText(destination.description || '', 100)}</p>
                <div class="parking-availability-badge">
                    <span class="parking-icon">🅿️</span>
                    <span class="parking-text">Nearby Parking Available: <strong>${availableParkingSlots} slots</strong></span>
                    <a href="smart-parking.html" class="parking-link">View Parking →</a>
                </div>
                <div class="destination-footer">
                    <div class="destination-price">
                        <span class="price-label">From</span>
                        <span class="price-value">₹${formatPrice(destination.average_budget || destination.price_starting || 0)}</span>
                    </div>
                    <button class="destination-btn" data-id="${destination.id}">View Details</button>
                </div>
            </div>
        `;

        // Add specific event listener for View Details
        const btn = card.querySelector('.destination-btn');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleViewDetails(destination);
            });
        }

        // Add click event to whole card just in case
        card.addEventListener('click', function () {
            handleViewDetails(destination);
        });

        grid.appendChild(card);
    });

    // Setup observers for animations (UI requirement)
    // Removed wait on setupCardObservers as it is just defined below.
    setupCardObservers();
}

// Render Error State with Retry Button
function renderError() {
    const grid = document.getElementById('destinationsGrid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="error-message">
            <div style="text-align: center; padding: 60px 20px; grid-column: 1 / -1;">
                <div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
                <h3 style="font-size: 24px; color: #e74c3c; margin-bottom: 10px;">${error || "Failed to load destinations"}</h3>
                <p style="color: #7F8C8D; font-size: 16px; margin-bottom: 20px;">Please check your connection and try again.</p>
                <!-- 8) Add Retry button -->
                <button id="retryBtn" style="padding: 12px 30px; background: #4A90E2; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">Retry</button>
            </div>
        </div>
    `;

    // Retry should re-trigger fetch function
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
        retryBtn.addEventListener('click', fetchDestinations);
    }
}

// Loading State UI
function showLoadingState() {
    const grid = document.getElementById('destinationsGrid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="loading-message">
            <div style="text-align: center; padding: 60px 20px; grid-column: 1 / -1;">
                <div style="font-size: 64px; margin-bottom: 20px;">🌍</div>
                <h3 style="font-size: 24px; color: #2C3E50; margin-bottom: 10px;">Loading Destinations...</h3>
                <p style="color: #7F8C8D; font-size: 16px;">Finding the best places for you</p>
                <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto;"></div>
            </div>
        </div>
        <style>
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
    `;
}

// =====================================================
// DEBOUNCE FUNCTION FOR SEARCH
// =====================================================
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

// =====================================================
// ADVANCED SEARCH SETUP WITH DEBOUNCE
// =====================================================
function setupAdvancedSearch() {
    const searchInput = document.getElementById('advancedSearchInput');
    const suggestionsBox = document.getElementById('searchSuggestions');

    if (!searchInput) return;

    // Debounced search handler (300ms delay for professional feel)
    const handleAdvancedSearch = debounce(function (value) {
        if (value.trim() === '') {
            suggestionsBox.style.display = 'none';
            return;
        }

        // Get current filter values
        const destinationFilter = document.getElementById('destinationFilter');
        const budgetFilter = document.getElementById('budgetFilter');
        const typeFilter = document.getElementById('typeFilter');

        // Apply search with existing filters
        filterDestinationsWithParams(
            destinationFilter,
            budgetFilter,
            typeFilter,
            value.trim()
        );

        // Hide suggestions after search
        suggestionsBox.style.display = 'none';
    }, 300);

    // Input event listener
    searchInput.addEventListener('input', function (e) {
        const value = e.target.value;

        if (value.trim() === '') {
            suggestionsBox.style.display = 'none';
            fetchDestinations(); // Reset to all destinations
            return;
        }

        // Show loading state
        setLoading(true);

        // Call debounced search handler
        handleAdvancedSearch(value);
    });

    // Clear search on focus if needed
    searchInput.addEventListener('focus', function () {
        // Optional: Show all destinations on focus if empty
        if (this.value.trim() === '') {
            suggestionsBox.style.display = 'none';
        }
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.advanced-search-container')) {
            suggestionsBox.style.display = 'none';
        }
    });

    // Handle Enter key
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const destinationFilter = document.getElementById('destinationFilter');
            const budgetFilter = document.getElementById('budgetFilter');
            const typeFilter = document.getElementById('typeFilter');

            filterDestinationsWithParams(
                destinationFilter,
                budgetFilter,
                typeFilter,
                this.value.trim()
            );
            suggestionsBox.style.display = 'none';
        }
    });
}

// Setup Filters
function setupFilters() {
    const destinationFilter = document.getElementById('destinationFilter');
    const budgetFilter = document.getElementById('budgetFilter');
    const typeFilter = document.getElementById('typeFilter');
    const filterBtn = document.querySelector('.filter-search-btn');

    const handleFilter = () => {
        filterDestinationsWithParams(destinationFilter, budgetFilter, typeFilter);
    };

    if (filterBtn) filterBtn.addEventListener('click', handleFilter);

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleFilter();
            }
        });
    }

    // Optional: Filter on change
    [destinationFilter, budgetFilter, typeFilter].forEach(filter => {
        if (filter) filter.addEventListener('change', handleFilter);
    });
}

// Filter logic interacting with API
async function filterDestinationsWithParams(destinationFilter, budgetFilter, typeFilter, searchTerm = '') {
    const selectedState = destinationFilter ? destinationFilter.value : '';
    const selectedBudget = budgetFilter ? budgetFilter.value.toLowerCase() : '';
    const selectedType = typeFilter ? typeFilter.value : '';

    const params = {};

    // Add search parameter if provided
    if (searchTerm) {
        params.search = searchTerm;
    }

    // Pass category directly (values match database)
    if (selectedType) {
        params.category = selectedType;
    }

    // Pass state directly for Indian states
    if (selectedState) {
        params.state = selectedState;
    }

    // Budget filters - adjusted for Indian Rupees
    if (selectedBudget === 'budget') {
        params.maxPrice = 3000;
    } else if (selectedBudget === 'moderate') {
        params.minPrice = 3000;
        params.maxPrice = 6000;
    } else if (selectedBudget === 'luxury') {
        params.minPrice = 6000;
    }

    try {
        await fetchDestinations(params);
    } catch (err) {
        console.error("Filter error", err);
        setError("Failed to filter destinations");
        setLoading(false);
        renderError();
    }
}

// UI Setup & Interactions
function setupInteractions() {
    // Parallax
    window.addEventListener('scroll', function () {
        const scrolled = window.pageYOffset;
        const heroImg = document.querySelector('.explore-hero-bg');
        if (heroImg) {
            heroImg.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });

    // Horizontal Scroll
    const featuredScroll = document.querySelector('.featured-scroll');
    if (featuredScroll) {
        let isDown = false;
        let startX;
        let scrollLeft;

        featuredScroll.addEventListener('mousedown', (e) => {
            isDown = true;
            featuredScroll.style.cursor = 'grabbing';
            startX = e.pageX - featuredScroll.offsetLeft;
            scrollLeft = featuredScroll.scrollLeft;
        });
        featuredScroll.addEventListener('mouseleave', () => { isDown = false; featuredScroll.style.cursor = 'grab'; });
        featuredScroll.addEventListener('mouseup', () => { isDown = false; featuredScroll.style.cursor = 'grab'; });
        featuredScroll.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - featuredScroll.offsetLeft;
            const walk = (x - startX) * 2;
            featuredScroll.scrollLeft = scrollLeft - walk;
        });
    }
}

// Animations
function setupCardObservers() {
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const destinationCards = document.querySelectorAll('.destination-card');
    destinationCards.forEach(card => observer.observe(card));
}

// Helpers
function mapStateToRegion(state) {
    // For backward compatibility with data attributes
    return state ? state.toLowerCase().replace(/\s+/g, '-') : 'india';
}

function getBudgetCategory(price) {
    // Budget categories in Indian Rupees
    if (price < 3000) return 'budget';
    if (price < 6000) return 'moderate';
    return 'luxury';
}

function formatPrice(price) {
    return parseFloat(price).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength).trim() + '...';
}

function handleViewDetails(destination) {
    console.log('View details for:', destination.name);
    window.location.href = `destination.html?id=${destination.id}`;
}

function showNoResults() {
    const grid = document.getElementById('destinationsGrid');
    if (!grid) return;
    grid.innerHTML = `
        <div class="no-results-message">
            <div style="text-align: center; padding: 60px 20px; grid-column: 1 / -1;">
                <div style="font-size: 64px; margin-bottom: 20px;">🔍</div>
                <h3 style="font-size: 24px; color: #2C3E50; margin-bottom: 10px;">No Destinations Found</h3>
                <p style="color: #7F8C8D; font-size: 16px;">Try adjusting your filters to see more results</p>
            </div>
        </div>
    `;
}
