// =====================================================
// ANALYTICS PAGE SCRIPT
// Chart.js integration for parking analytics visualization
// =====================================================

const API_BASE_URL = 'http://localhost:3000/api';

// Chart instances
let peakHoursChart = null;
let dailyOccupancyChart = null;
let mostUsedSlotsChart = null;
let statusDistributionChart = null;

// Analytics data
let analyticsData = null;

// =====================================================
// FETCH ANALYTICS DATA
// =====================================================

async function fetchAnalytics() {
    try {
        const response = await fetch(`${API_BASE_URL}/parking/analytics`);
        if (!response.ok) throw new Error('Failed to fetch analytics');

        const result = await response.json();
        if (result.success && result.data) {
            analyticsData = result.data;
            updateQuickStats();
            renderCharts();
            renderInsights();
        }
    } catch (error) {
        console.error('Error fetching analytics:', error);
        showError();
    }
}
// =====================================================
// UPDATE QUICK STATS
// =====================================================

function updateQuickStats() {
    if (!analyticsData || !analyticsData.totalUsage) return;

    const { totalUsage, avgOccupancyMinutes } = analyticsData;

    document.getElementById('totalLogs').textContent = totalUsage.total_logs || 0;
    document.getElementById('totalOccupied').textContent = totalUsage.total_occupied || 0;
    document.getElementById('totalReserved').textContent = totalUsage.total_reserved || 0;
    document.getElementById('avgDuration').textContent = Math.round(avgOccupancyMinutes) || '--';
}

// =====================================================
// RENDER CHARTS
// =====================================================

function renderCharts() {
    renderPeakHoursChart();
    renderDailyOccupancyChart();
    renderMostUsedSlotsChart();
    renderStatusDistributionChart();
}

function renderPeakHoursChart() {
    const ctx = document.getElementById('peakHoursChart').getContext('2d');
    const peakHours = analyticsData?.peakHours || [];

    // Prepare full 24-hour data
    const hourData = new Array(24).fill(0);
    peakHours.forEach(h => {
        hourData[h.hour] = h.count;
    });

    const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);

    // Destroy existing chart if any
    if (peakHoursChart) {
        peakHoursChart.destroy();
    }

    peakHoursChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Occupancy Events',
                data: hourData,
                backgroundColor: createGradient(ctx, '#4A90E2', '#5BA3F5'),
                borderRadius: 6,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    cornerRadius: 8,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        stepSize: 1
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

function renderDailyOccupancyChart() {
    const ctx = document.getElementById('dailyOccupancyChart').getContext('2d');
    const dailyOccupancy = analyticsData?.dailyOccupancy || [];

    const labels = dailyOccupancy.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const data = dailyOccupancy.map(d => d.occupiedCount);

    // Destroy existing chart if any
    if (dailyOccupancyChart) {
        dailyOccupancyChart.destroy();
    }

    dailyOccupancyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Occupied Events',
                data: data,
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#10B981',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    cornerRadius: 8,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function renderMostUsedSlotsChart() {
    const ctx = document.getElementById('mostUsedSlotsChart').getContext('2d');
    const mostUsedSlots = analyticsData?.mostUsedSlots || [];

    const labels = mostUsedSlots.map(s => `Slot ${s.slot_number}`);
    const data = mostUsedSlots.map(s => s.usage_count);

    // Destroy existing chart if any
    if (mostUsedSlotsChart) {
        mostUsedSlotsChart.destroy();
    }

    mostUsedSlotsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Usage Count',
                data: data,
                backgroundColor: [
                    '#F59E0B',
                    '#EF4444',
                    '#10B981',
                    '#4A90E2',
                    '#8B5CF6'
                ],
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    cornerRadius: 8,
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function renderStatusDistributionChart() {
    const ctx = document.getElementById('statusDistributionChart').getContext('2d');
    const totalUsage = analyticsData?.totalUsage || {};

    const data = [
        totalUsage.total_occupied || 0,
        totalUsage.total_reserved || 0,
        totalUsage.total_available || 0
    ];

    // Destroy existing chart if any
    if (statusDistributionChart) {
        statusDistributionChart.destroy();
    }

    statusDistributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Occupied', 'Reserved', 'Available'],
            datasets: [{
                data: data,
                backgroundColor: [
                    '#EF4444',
                    '#F59E0B',
                    '#10B981'
                ],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    cornerRadius: 8,
                }
            },
            cutout: '65%'
        }
    });
}

// Helper function to create gradient
function createGradient(ctx, color1, color2) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    return gradient;
}

// =====================================================
// RENDER INSIGHTS
// =====================================================

function renderInsights() {
    const insightsGrid = document.getElementById('insightsGrid');
    if (!insightsGrid || !analyticsData) return;

    const insights = generateInsights();

    insightsGrid.innerHTML = insights.map(insight => `
        <div class="insight-card">
            <div class="insight-icon">${insight.icon}</div>
            <h4 class="insight-title">${insight.title}</h4>
            <div class="insight-value">${insight.value}</div>
            <p class="insight-description">${insight.description}</p>
        </div>
    `).join('');
}

function generateInsights() {
    const insights = [];
    const { peakHours, totalUsage, mostUsedSlots, avgOccupancyMinutes } = analyticsData;

    // Peak hour insight
    if (peakHours && peakHours.length > 0) {
        const peakHour = peakHours.reduce((max, h) => h.count > max.count ? h : max, peakHours[0]);
        insights.push({
            icon: '🕐',
            title: 'Peak Hour',
            value: `${peakHour.hour}:00`,
            description: `The parking lot sees highest activity around ${peakHour.hour}:00 with ${peakHour.count} occupancy events.`
        });
    }

    // Most popular slot
    if (mostUsedSlots && mostUsedSlots.length > 0) {
        const topSlot = mostUsedSlots[0];
        insights.push({
            icon: '🏆',
            title: 'Most Popular Slot',
            value: `Slot #${topSlot.slot_number}`,
            description: `This slot has been used ${topSlot.usage_count} times, making it the most frequently used parking spot.`
        });
    }

    // Utilization rate
    if (totalUsage) {
        const totalEvents = totalUsage.total_logs;
        const occupiedEvents = totalUsage.total_occupied;
        const utilizationRate = totalEvents > 0 ? Math.round((occupiedEvents / totalEvents) * 100) : 0;
        insights.push({
            icon: '📊',
            title: 'Utilization Rate',
            value: `${utilizationRate}%`,
            description: `${utilizationRate}% of all parking events resulted in actual occupancy.`
        });
    }

    // Average occupancy duration
    if (avgOccupancyMinutes && avgOccupancyMinutes > 0) {
        insights.push({
            icon: '⏱️',
            title: 'Avg. Stay Duration',
            value: `${Math.round(avgOccupancyMinutes)} min`,
            description: `On average, vehicles stay parked for approximately ${Math.round(avgOccupancyMinutes)} minutes.`
        });
    }

    // Reservation rate
    if (totalUsage) {
        const reservedEvents = totalUsage.total_reserved || 0;
        const occupiedEvents = totalUsage.total_occupied || 0;
        if (occupiedEvents > 0) {
            const reservationRate = Math.round((reservedEvents / occupiedEvents) * 100);
            insights.push({
                icon: '📌',
                title: 'Reservation Rate',
                value: `${reservationRate}%`,
                description: `${reservationRate}% of parking events were pre-reserved through the system.`
            });
        }
    }

    // Total activity
    if (totalUsage) {
        insights.push({
            icon: '📈',
            title: 'Total Activity',
            value: `${totalUsage.total_logs}`,
            description: `The parking system has logged ${totalUsage.total_logs} status changes in total.`
        });
    }

    return insights;
}

// =====================================================
// ERROR HANDLING
// =====================================================

function showError() {
    const insightsGrid = document.getElementById('insightsGrid');
    if (insightsGrid) {
        insightsGrid.innerHTML = `
            <div class="loading-insights" style="grid-column: 1 / -1;">
                <p style="color: #EF4444;">Unable to load analytics data. Please try again later.</p>
                <button onclick="fetchAnalytics()" style="margin-top: 15px; padding: 10px 24px; background: var(--primary-color); color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Retry
                </button>
            </div>
        `;
    }
}

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

document.addEventListener('DOMContentLoaded', () => {
    fetchAnalytics();

    // Refresh analytics every 30 seconds
    setInterval(fetchAnalytics, 30000);
});
