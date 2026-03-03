// =====================================================
// MY PARKING PAGE - JavaScript
// View and manage parking bookings
// =====================================================

(function () {
    const API_BASE = '/api/smart-parking';
    
    // State
    let allBookings = [];
    let currentFilter = 'all';
    let selectedBooking = null;

    // DOM Elements
    const bookingsList = document.getElementById('bookingsList');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const noBookings = document.getElementById('noBookings');
    
    // Stats Elements
    const statTotalBookings = document.getElementById('statTotalBookings');
    const statActiveBookings = document.getElementById('statActiveBookings');
    const statCompletedBookings = document.getElementById('statCompletedBookings');
    const statTotalSpent = document.getElementById('statTotalSpent');

    // Modal Elements
    const bookingModal = document.getElementById('bookingModal');
    const closeModalBtn = document.getElementById('closeModal');
    const cancelBookingBtn = document.getElementById('cancelBookingBtn');
    const completeBookingBtn = document.getElementById('completeBookingBtn');

    // Utility Functions
    const getToken = () => localStorage.getItem('token') || localStorage.getItem('voyago_token');

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

    const showLoading = () => {
        loadingSpinner.style.display = 'flex';
        noBookings.style.display = 'none';
        bookingsList.innerHTML = '';
    };

    const hideLoading = () => {
        loadingSpinner.style.display = 'none';
    };

    // API Functions
    const fetchBookings = async (status = null) => {
        try {
            const token = getToken();
            let url = `${API_BASE}/bookings`;
            if (status && status !== 'all') {
                url += `?status=${status}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return await response.json();
        } catch (error) {
            console.error('Error fetching bookings:', error);
            return { success: false, data: [] };
        }
    };

    const fetchStats = async () => {
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE}/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return await response.json();
        } catch (error) {
            console.error('Error fetching stats:', error);
            return { success: false };
        }
    };

    const cancelBooking = async (bookingId) => {
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return await response.json();
        } catch (error) {
            console.error('Error cancelling booking:', error);
            return { success: false, message: 'Failed to cancel booking' };
        }
    };

    const completeBooking = async (bookingId) => {
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE}/bookings/${bookingId}/complete`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return await response.json();
        } catch (error) {
            console.error('Error completing booking:', error);
            return { success: false, message: 'Failed to complete booking' };
        }
    };

    // Render Functions
    const updateStats = (stats) => {
        statTotalBookings.textContent = stats.total_bookings || 0;
        statActiveBookings.textContent = stats.active_bookings || 0;
        statCompletedBookings.textContent = stats.completed_bookings || 0;
        statTotalSpent.textContent = formatCurrency(stats.total_spent || 0);
    };

    const renderBookings = (bookings) => {
        if (bookings.length === 0) {
            noBookings.style.display = 'block';
            bookingsList.innerHTML = '';
            return;
        }

        noBookings.style.display = 'none';
        bookingsList.innerHTML = bookings.map(booking => `
            <div class="booking-card" data-booking-id="${booking.id}">
                <div class="booking-card-header">
                    <div class="booking-card-title">
                        <h4>${booking.location_name}</h4>
                        <span class="booking-id">${booking.booking_id}</span>
                    </div>
                    <span class="status-badge ${booking.status}">${booking.status}</span>
                </div>
                <div class="booking-card-details">
                    <div class="booking-detail">
                        <span class="label">City</span>
                        <span class="value">${booking.city}</span>
                    </div>
                    <div class="booking-detail">
                        <span class="label">Slot</span>
                        <span class="value">${booking.slot_number}</span>
                    </div>
                    <div class="booking-detail">
                        <span class="label">Time</span>
                        <span class="value">${formatDateTime(booking.booking_start_time)}</span>
                    </div>
                    <div class="booking-detail">
                        <span class="label">Amount</span>
                        <span class="value price">${formatCurrency(booking.total_amount)}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Add click listeners
        document.querySelectorAll('.booking-card').forEach(card => {
            card.addEventListener('click', () => {
                const bookingId = card.dataset.bookingId;
                const booking = allBookings.find(b => b.id == bookingId);
                if (booking) {
                    openBookingModal(booking);
                }
            });
        });
    };

    // Modal Functions
    const openBookingModal = (booking) => {
        selectedBooking = booking;

        // Update modal content
        document.getElementById('modalStatus').textContent = booking.status;
        document.getElementById('modalStatus').className = `booking-status-badge ${booking.status}`;
        document.getElementById('modalBookingId').textContent = booking.booking_id;
        document.getElementById('modalLocation').textContent = booking.location_name;
        document.getElementById('modalCity').textContent = booking.city;
        document.getElementById('modalSlot').textContent = booking.slot_number;
        document.getElementById('modalAmount').textContent = formatCurrency(booking.total_amount);
        document.getElementById('modalTime').textContent = 
            `${formatDateTime(booking.booking_start_time)} - ${formatDateTime(booking.booking_end_time)}`;

        // Show/hide QR code
        const qrSection = document.getElementById('qrSection');
        const qrImg = document.getElementById('modalQRCode');
        if (booking.qr_code_url && booking.status === 'active') {
            qrImg.src = booking.qr_code_url;
            qrSection.style.display = 'block';
        } else {
            qrSection.style.display = 'none';
        }

        // Show/hide action buttons based on status
        const modalActions = document.getElementById('modalActions');
        if (booking.status === 'active') {
            modalActions.style.display = 'flex';
            cancelBookingBtn.style.display = 'block';
            completeBookingBtn.style.display = 'block';
        } else {
            modalActions.style.display = 'none';
        }

        bookingModal.style.display = 'flex';
    };

    const closeBookingModal = () => {
        bookingModal.style.display = 'none';
        selectedBooking = null;
    };

    // Load Data
    const loadData = async () => {
        showLoading();

        // Fetch stats
        const statsResult = await fetchStats();
        if (statsResult.success) {
            updateStats(statsResult.data.stats);
        }

        // Fetch all bookings
        const bookingsResult = await fetchBookings();
        hideLoading();

        if (bookingsResult.success) {
            allBookings = bookingsResult.data;
            filterBookings(currentFilter);
        } else {
            noBookings.style.display = 'block';
        }
    };

    const filterBookings = (filter) => {
        currentFilter = filter;
        let filtered = allBookings;

        if (filter !== 'all') {
            filtered = allBookings.filter(b => b.status === filter);
        }

        renderBookings(filtered);
    };

    // Event Listeners
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            filterBookings(tab.dataset.filter);
        });
    });

    closeModalBtn.addEventListener('click', closeBookingModal);
    document.querySelector('#bookingModal .modal-overlay').addEventListener('click', closeBookingModal);

    cancelBookingBtn.addEventListener('click', async () => {
        if (!selectedBooking) return;

        if (!confirm('Are you sure you want to cancel this booking?')) return;

        cancelBookingBtn.disabled = true;
        cancelBookingBtn.textContent = 'Cancelling...';

        const result = await cancelBooking(selectedBooking.id);

        cancelBookingBtn.disabled = false;
        cancelBookingBtn.textContent = 'Cancel Booking';

        if (result.success) {
            closeBookingModal();
            loadData(); // Refresh data
        } else {
            alert(result.message || 'Failed to cancel booking');
        }
    });

    completeBookingBtn.addEventListener('click', async () => {
        if (!selectedBooking) return;

        if (!confirm('Mark this booking as completed?')) return;

        completeBookingBtn.disabled = true;
        completeBookingBtn.textContent = 'Processing...';

        const result = await completeBooking(selectedBooking.id);

        completeBookingBtn.disabled = false;
        completeBookingBtn.textContent = 'Mark as Completed';

        if (result.success) {
            closeBookingModal();
            loadData(); // Refresh data
        } else {
            alert(result.message || 'Failed to complete booking');
        }
    });

    // Initialize
    loadData();
})();
