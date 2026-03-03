// =====================================================
// SMART PARKING PAGE SCRIPT
// Real-time parking slot management with IoT integration
// =====================================================

const API_BASE_URL = 'http://localhost:3000/api';

// State management
let parkingSlots = [];
let selectedSlotId = null;
let reservationTimers = new Map();

// DOM Elements
const parkingSlotsGrid = document.getElementById('parkingSlotsGrid');
const reservationModal = document.getElementById('reservationModal');
const modalSlotNumber = document.getElementById('modalSlotNumber');
const modalClose = document.getElementById('modalClose');
const modalCancel = document.getElementById('modalCancel');
const modalConfirm = document.getElementById('modalConfirm');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// =====================================================
// FETCH DATA FROM API
// =====================================================

async function fetchParkingSummary() {
    try {
        console.log('[fetchParkingSummary] Fetching from:', `${API_BASE_URL}/parking/summary`);
        const response = await fetch(`${API_BASE_URL}/parking/summary`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[fetchParkingSummary] Response not OK:', response.status, errorText);
            throw new Error(`Failed to fetch summary: ${response.status}`);
        }

        const result = await response.json();
        console.log('[fetchParkingSummary] Result:', result);
        
        if (result.success && result.data) {
            updateSummaryStats(result.data);
        }
    } catch (error) {
        console.error('[fetchParkingSummary] Parking API error:', error.message, error);
    }
}

async function fetchParkingSlots() {
    try {
        console.log('[fetchParkingSlots] Fetching from:', `${API_BASE_URL}/parking`);
        const response = await fetch(`${API_BASE_URL}/parking`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[fetchParkingSlots] Response not OK:', response.status, errorText);
            throw new Error(`Failed to fetch slots: ${response.status}`);
        }

        const result = await response.json();
        console.log('[fetchParkingSlots] Result:', result);
        
        if (result.success && result.data) {
            parkingSlots = result.data;
            renderParkingSlots();
        } else {
            console.error('[fetchParkingSlots] Invalid response structure:', result);
            showError('Unable to load parking slots. Please try again.');
        }
    } catch (error) {
        console.error('[fetchParkingSlots] Parking API error:', error.message, error);
        showError('Unable to load parking slots. Please try again.');
    }
}

async function reserveSlot(slotId) {
    try {
        const response = await fetch(`${API_BASE_URL}/parking/reserve/${slotId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success) {
            showToast('🎉 Slot reserved successfully! Expires in 10 minutes.');
            fetchParkingSlots();
            fetchParkingSummary();
            startReservationTimer(slotId, 600); // 10 minutes in seconds
        } else {
            showToast(result.message || 'Failed to reserve slot', 'error');
        }

        return result.success;
    } catch (error) {
        console.error('Error reserving slot:', error);
        showToast('Network error. Please try again.', 'error');
        return false;
    }
}

// =====================================================
// UI RENDERING
// =====================================================

function updateSummaryStats(data) {
    document.getElementById('statTotal').textContent = data.total || 0;
    document.getElementById('statAvailable').textContent = data.available || 0;
    document.getElementById('statOccupied').textContent = data.occupied || 0;
    document.getElementById('statReserved').textContent = data.reserved || 0;

    if (data.lastUpdated) {
        const date = new Date(data.lastUpdated);
        document.getElementById('lastUpdateTime').textContent = date.toLocaleString();
    }
}

function renderParkingSlots() {
    if (!parkingSlotsGrid) return;

    parkingSlotsGrid.innerHTML = '';

    parkingSlots.forEach(slot => {
        const slotElement = createSlotElement(slot);
        parkingSlotsGrid.appendChild(slotElement);
    });
}

function createSlotElement(slot) {
    const div = document.createElement('div');
    div.className = `parking-slot ${slot.status}`;
    div.dataset.slotId = slot.id;

    const icon = getStatusIcon(slot.status);
    const statusText = slot.status.charAt(0).toUpperCase() + slot.status.slice(1);

    div.innerHTML = `
        <span class="slot-icon">${icon}</span>
        <span class="slot-number">${slot.slot_number}</span>
        <span class="slot-status">${statusText}</span>
        ${slot.status === 'reserved' ? '<span class="slot-timer" id="timer-' + slot.id + '"></span>' : ''}
    `;

    // Only available slots can be clicked
    if (slot.status === 'available') {
        div.addEventListener('click', () => openReservationModal(slot));
    }

    return div;
}

function getStatusIcon(status) {
    switch (status) {
        case 'available':
            return '✅';
        case 'occupied':
            return '🚗';
        case 'reserved':
            return '📌';
        default:
            return '🅿️';
    }
}

function showError(message) {
    if (parkingSlotsGrid) {
        parkingSlotsGrid.innerHTML = `
            <div class="loading-spinner" style="grid-column: 1 / -1;">
                <p style="color: #EF4444;">${message}</p>
                <button onclick="fetchParkingSlots()" style="margin-top: 15px; padding: 10px 20px; background: var(--primary-color); color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Try Again
                </button>
            </div>
        `;
    }
}

// =====================================================
// MODAL HANDLING
// =====================================================

function openReservationModal(slot) {
    selectedSlotId = slot.id;
    modalSlotNumber.textContent = slot.slot_number;
    reservationModal.classList.add('active');
}

function closeReservationModal() {
    reservationModal.classList.remove('active');
    selectedSlotId = null;
}

async function confirmReservation() {
    if (!selectedSlotId) return;

    const confirmBtn = modalConfirm;
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Reserving...';

    const success = await reserveSlot(selectedSlotId);

    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Confirm Reservation';

    if (success) {
        closeReservationModal();
    }
}

// =====================================================
// RESERVATION TIMER
// =====================================================

function startReservationTimer(slotId, seconds) {
    // Clear existing timer if any
    if (reservationTimers.has(slotId)) {
        clearInterval(reservationTimers.get(slotId));
    }

    let remainingSeconds = seconds;

    const timerInterval = setInterval(() => {
        remainingSeconds--;

        const timerElement = document.getElementById(`timer-${slotId}`);
        if (timerElement) {
            const minutes = Math.floor(remainingSeconds / 60);
            const secs = remainingSeconds % 60;
            timerElement.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
        }

        if (remainingSeconds <= 0) {
            clearInterval(timerInterval);
            reservationTimers.delete(slotId);
            fetchParkingSlots();
            fetchParkingSummary();
        }
    }, 1000);

    reservationTimers.set(slotId, timerInterval);
}

// =====================================================
// TOAST NOTIFICATION
// =====================================================

function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.querySelector('.toast-icon').textContent = type === 'success' ? '✅' : '❌';
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// =====================================================
// EVENT LISTENERS
// =====================================================

// Modal events
modalClose.addEventListener('click', closeReservationModal);
modalCancel.addEventListener('click', closeReservationModal);
modalConfirm.addEventListener('click', confirmReservation);

// Close modal on overlay click
reservationModal.addEventListener('click', (e) => {
    if (e.target === reservationModal) {
        closeReservationModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && reservationModal.classList.contains('active')) {
        closeReservationModal();
    }
});

// =====================================================
// MOBILE NAVIGATION TOGGLE
// =====================================================

const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}

// =====================================================
// INITIALIZATION
// =====================================================

function init() {
    // Initial data fetch
    fetchParkingSummary();
    fetchParkingSlots();

    // Real-time polling every 5 seconds
    setInterval(() => {
        fetchParkingSummary();
        fetchParkingSlots();
    }, 5000);
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
