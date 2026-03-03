// =====================================================
// SMART PARKING PAGE - JavaScript
// Search, view, and book parking slots
// =====================================================

(function () {
    const API_BASE = '/api/smart-parking';
    
    // State
    let selectedLocation = null;
    let selectedSlot = null;
    let pricePerHour = 0;
    let latestQrToken = '';

    // DOM Elements
    const citySearchInput = document.getElementById('citySearch');
    const radiusSelect = document.getElementById('radiusSelect');
    const searchByCityBtn = document.getElementById('searchByCity');
    const useLocationBtn = document.getElementById('useLocation');
    const parkingResults = document.getElementById('parkingResults');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const noResults = document.getElementById('noResults');
    const resultsTitle = document.getElementById('resultsTitle');
    const resultsCount = document.getElementById('resultsCount');

    // Modal Elements
    const locationModal = document.getElementById('locationModal');
    const closeModalBtn = document.getElementById('closeModal');
    const successModal = document.getElementById('successModal');
    const closeSuccessBtn = document.getElementById('closeSuccessModal');
    const viewMyBookingsBtn = document.getElementById('viewMyBookings');
    const copyQrTokenBtn = document.getElementById('copyQrToken');

    // Booking Form Elements
    const bookingForm = document.getElementById('bookingForm');
    const bookingDateInput = document.getElementById('bookingDate');
    const bookingTimeInput = document.getElementById('bookingTime');
    const durationSelect = document.getElementById('durationHours');
    const confirmBookingBtn = document.getElementById('confirmBooking');
    const cancelBookingBtn = document.getElementById('cancelBooking');

    // Utility Functions
    const getToken = () => localStorage.getItem('token') || localStorage.getItem('voyago_token');

    const showLoading = () => {
        loadingSpinner.style.display = 'flex';
        noResults.style.display = 'none';
        parkingResults.innerHTML = '';
    };

    const hideLoading = () => {
        loadingSpinner.style.display = 'none';
    };

    const showNoResults = () => {
        noResults.style.display = 'block';
        resultsCount.textContent = '';
    };

    const formatCurrency = (amount) => `₹${parseFloat(amount).toFixed(0)}`;

    const formatDateTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // API Functions
    const searchParkingByCity = async (city) => {
        try {
            showLoading();
            const response = await fetch(`${API_BASE}/locations/search?city=${encodeURIComponent(city)}`);
            const data = await response.json();
            
            hideLoading();
            
            if (data.success && data.data.length > 0) {
                resultsTitle.textContent = `Parking in ${city}`;
                resultsCount.textContent = `${data.data.length} location${data.data.length > 1 ? 's' : ''} found`;
                renderParkingLocations(data.data);
            } else {
                showNoResults();
            }
        } catch (error) {
            console.error('Search error:', error);
            hideLoading();
            showNoResults();
        }
    };

    const searchParkingByCoords = async (lat, lng, radius) => {
        try {
            showLoading();
            const response = await fetch(`${API_BASE}/locations/search?lat=${lat}&lng=${lng}&radius=${radius}`);
            const data = await response.json();
            
            hideLoading();
            
            if (data.success && data.data.length > 0) {
                resultsTitle.textContent = 'Nearby Parking';
                resultsCount.textContent = `${data.data.length} location${data.data.length > 1 ? 's' : ''} within ${radius}km`;
                renderParkingLocations(data.data);
            } else {
                showNoResults();
            }
        } catch (error) {
            console.error('Search error:', error);
            hideLoading();
            showNoResults();
        }
    };

    const getLocationDetails = async (locationId) => {
        try {
            const response = await fetch(`${API_BASE}/locations/${locationId}`);
            const data = await response.json();
            
            if (data.success) {
                return data.data;
            }
            return null;
        } catch (error) {
            console.error('Error fetching location details:', error);
            return null;
        }
    };

    const createBooking = async (bookingData) => {
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bookingData)
            });
            
            return await response.json();
        } catch (error) {
            console.error('Booking error:', error);
            return { success: false, message: 'Failed to create booking' };
        }
    };

    // Render Functions
    const renderParkingLocations = (locations) => {
        parkingResults.innerHTML = locations.map(location => {
            const availabilityPercent = (location.available_slots / location.total_slots) * 100;
            let badgeClass = 'high';
            let badgeText = 'Available';
            
            if (availabilityPercent === 0) {
                badgeClass = 'low';
                badgeText = 'Full';
            } else if (availabilityPercent < 30) {
                badgeClass = 'low';
                badgeText = 'Few Left';
            } else if (availabilityPercent < 60) {
                badgeClass = 'medium';
                badgeText = 'Filling Up';
            }

            const distance = location.distance !== undefined 
                ? `<span>• ${location.distance.toFixed(2)} km away</span>` 
                : '';

            return `
                <div class="parking-card" data-location-id="${location.id}">
                    <div class="parking-card-header">
                        <h4>${location.name}</h4>
                        <span class="availability-badge ${badgeClass}">${badgeText}</span>
                    </div>
                    <div class="parking-card-location">
                        <span>📍 ${location.city}, ${location.state}</span>
                        ${distance}
                    </div>
                    <div class="parking-card-stats">
                        <div class="parking-stat">
                            <span class="label">Available</span>
                            <span class="value available">${location.available_slots}</span>
                        </div>
                        <div class="parking-stat">
                            <span class="label">Total</span>
                            <span class="value">${location.total_slots}</span>
                        </div>
                        <div class="parking-stat">
                            <span class="label">Rate</span>
                            <span class="value price">${formatCurrency(location.price_per_hour)}/hr</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add click listeners
        document.querySelectorAll('.parking-card').forEach(card => {
            card.addEventListener('click', () => {
                const locationId = card.dataset.locationId;
                openLocationModal(locationId);
            });
        });
    };

    const renderSlots = (slots) => {
        const slotsGrid = document.getElementById('slotsGrid');
        slotsGrid.innerHTML = slots.map(slot => `
            <div class="slot-item ${slot.status}" 
                 data-slot-id="${slot.id}" 
                 data-slot-number="${slot.slot_number}"
                 data-status="${slot.status}">
                ${slot.slot_number}
            </div>
        `).join('');

        // Add click listeners for available slots only
        slotsGrid.querySelectorAll('.slot-item.available').forEach(slotEl => {
            slotEl.addEventListener('click', () => selectSlot(slotEl));
        });
    };

    // Modal Functions
    const openLocationModal = async (locationId) => {
        const locationData = await getLocationDetails(locationId);
        if (!locationData) {
            alert('Failed to load location details');
            return;
        }

        selectedLocation = locationData;
        pricePerHour = parseFloat(locationData.price_per_hour);

        // Update modal content
        document.getElementById('modalLocationName').textContent = locationData.name;
        document.getElementById('modalLocationAddress').textContent = 
            `${locationData.address || ''} ${locationData.city}, ${locationData.state}`;
        document.getElementById('modalTotalSlots').textContent = locationData.total_slots;
        document.getElementById('modalAvailableSlots').textContent = locationData.available_slots;
        document.getElementById('modalPricePerHour').textContent = formatCurrency(pricePerHour);

        // Show/hide warning
        const warningBanner = document.getElementById('occupiedWarning');
        if (locationData.available_slots === 0) {
            warningBanner.style.display = 'flex';
        } else {
            warningBanner.style.display = 'none';
        }

        // Render slots
        renderSlots(locationData.slots);

        // Reset booking form
        bookingForm.style.display = 'none';
        selectedSlot = null;
        
        // Set default date and time
        const now = new Date();
        bookingDateInput.value = now.toISOString().split('T')[0];
        bookingDateInput.min = now.toISOString().split('T')[0];
        bookingTimeInput.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        durationSelect.value = '2';
        
        updateBookingSummary();
        
        locationModal.style.display = 'flex';
    };

    const closeLocationModal = () => {
        locationModal.style.display = 'none';
        selectedLocation = null;
        selectedSlot = null;
    };

    const selectSlot = (slotEl) => {
        // Remove previous selection
        document.querySelectorAll('.slot-item.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Select new slot
        slotEl.classList.add('selected');
        selectedSlot = {
            id: slotEl.dataset.slotId,
            number: slotEl.dataset.slotNumber
        };

        // Show booking form
        document.getElementById('selectedSlotNumber').textContent = selectedSlot.number;
        bookingForm.style.display = 'block';
        updateBookingSummary();
    };

    const updateBookingSummary = () => {
        const duration = parseInt(durationSelect.value);
        const total = pricePerHour * duration;

        document.getElementById('summaryDuration').textContent = `${duration} hour${duration > 1 ? 's' : ''}`;
        document.getElementById('summaryRate').textContent = `${formatCurrency(pricePerHour)}/hour`;
        document.getElementById('summaryTotal').textContent = formatCurrency(total);
    };

    const handleConfirmBooking = async () => {
        if (!selectedLocation || !selectedSlot) {
            alert('Please select a slot');
            return;
        }

        const date = bookingDateInput.value;
        const time = bookingTimeInput.value;
        const duration = parseInt(durationSelect.value);

        if (!date || !time) {
            alert('Please select date and time');
            return;
        }

        const startTime = new Date(`${date}T${time}`);
        
        if (startTime < new Date()) {
            alert('Please select a future date and time');
            return;
        }

        confirmBookingBtn.disabled = true;
        confirmBookingBtn.textContent = 'Processing...';

        const result = await createBooking({
            location_id: selectedLocation.id,
            slot_id: selectedSlot.id,
            start_time: startTime.toISOString(),
            duration_hours: duration
        });

        confirmBookingBtn.disabled = false;
        confirmBookingBtn.textContent = 'Confirm Booking';

        if (result.success) {
            closeLocationModal();
            showSuccessModal(result.data);
        } else {
            alert(result.message || 'Failed to create booking');
            
            // Refresh slots if slot was taken
            if (result.entryDenied || result.message.includes('occupied')) {
                const updatedLocation = await getLocationDetails(selectedLocation.id);
                if (updatedLocation) {
                    selectedLocation = updatedLocation;
                    document.getElementById('modalAvailableSlots').textContent = updatedLocation.available_slots;
                    renderSlots(updatedLocation.slots);
                    bookingForm.style.display = 'none';
                }
            }
        }
    };

    const showSuccessModal = (booking) => {
        document.getElementById('successBookingId').textContent = booking.booking_id;
        latestQrToken = booking.qr_token || '';
        const tokenEl = document.getElementById('successQrToken');
        if (tokenEl) {
            tokenEl.textContent = latestQrToken || 'N/A';
        }
        document.getElementById('successLocation').textContent = booking.location_name;
        document.getElementById('successSlot').textContent = booking.slot_number;
        document.getElementById('successTime').textContent = 
            `${formatDateTime(booking.booking_start_time)} - ${formatDateTime(booking.booking_end_time)}`;
        document.getElementById('successAmount').textContent = formatCurrency(booking.total_amount);
        
        // Show QR code
        const qrImg = document.getElementById('successQRCode');
        if (booking.qr_code_url) {
            qrImg.src = booking.qr_code_url;
            qrImg.style.display = 'block';
        } else {
            qrImg.style.display = 'none';
        }

        const verifyUrlEl = document.getElementById('successVerifyUrl');
        if (verifyUrlEl) {
            const verifyUrl = booking?.qr_data?.verify_url || (booking.qr_token ? `${window.location.origin}/api/verify/${booking.qr_token}` : '');
            verifyUrlEl.textContent = verifyUrl ? `Verify URL: ${verifyUrl}` : '';
        }

        console.log('Booking QR token:', booking.qr_token);

        successModal.style.display = 'flex';
    };

    const closeSuccessModal = () => {
        successModal.style.display = 'none';
    };

    // Event Listeners
    searchByCityBtn.addEventListener('click', () => {
        const city = citySearchInput.value.trim();
        if (city) {
            searchParkingByCity(city);
        } else {
            alert('Please enter a city name');
        }
    });

    citySearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchByCityBtn.click();
        }
    });

    useLocationBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        useLocationBtn.disabled = true;
        useLocationBtn.textContent = '📍 Getting location...';

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const radius = radiusSelect.value;
                searchParkingByCoords(latitude, longitude, radius);
                useLocationBtn.disabled = false;
                useLocationBtn.textContent = '📍 Use My Location';
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Could not get your location. Please search by city name instead.');
                useLocationBtn.disabled = false;
                useLocationBtn.textContent = '📍 Use My Location';
            }
        );
    });

    // Quick city chips
    document.querySelectorAll('.city-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const city = chip.dataset.city;
            citySearchInput.value = city;
            searchParkingByCity(city);
        });
    });

    // Modal close
    closeModalBtn.addEventListener('click', closeLocationModal);
    document.querySelector('#locationModal .modal-overlay').addEventListener('click', closeLocationModal);

    // Booking form
    durationSelect.addEventListener('change', updateBookingSummary);
    confirmBookingBtn.addEventListener('click', handleConfirmBooking);
    cancelBookingBtn.addEventListener('click', () => {
        bookingForm.style.display = 'none';
        selectedSlot = null;
        document.querySelectorAll('.slot-item.selected').forEach(el => {
            el.classList.remove('selected');
        });
    });

    // Success modal
    closeSuccessBtn.addEventListener('click', closeSuccessModal);
    if (copyQrTokenBtn) {
        copyQrTokenBtn.addEventListener('click', async () => {
            if (!latestQrToken) {
                alert('QR token is not available for this booking');
                return;
            }

            try {
                await navigator.clipboard.writeText(latestQrToken);
                copyQrTokenBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyQrTokenBtn.textContent = 'Copy QR Token';
                }, 1500);
            } catch (error) {
                console.error('Failed to copy QR token:', error);
                alert('Could not copy token. Please copy it manually.');
            }
        });
    }
    viewMyBookingsBtn.addEventListener('click', () => {
        window.location.href = '/app/my-parking/';
    });

    // Load initial data - show popular cities
    const loadInitialData = async () => {
        try {
            const response = await fetch(`${API_BASE}/cities`);
            const data = await response.json();
            
            if (data.success) {
                console.log('Available cities:', data.data.map(c => c.city).join(', '));
            }
        } catch (error) {
            console.error('Error loading cities:', error);
        }
    };

    loadInitialData();
})();
