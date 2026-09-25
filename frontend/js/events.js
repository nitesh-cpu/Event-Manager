// Events handling module for all frontend views

document.addEventListener('DOMContentLoaded', function () {
    const page = document.body.dataset.page;

    if (page === 'index') {
        loadEventsIndex();
        setupSearchAndFilter();
    } else if (page === 'event-detail') {
        loadEventDetail();
    } else if (page === 'create-event') {
        setupCreateEventForm();
    } else if (page === 'edit-event') {
        loadAndSetupEditEventForm();
    } else if (page === 'my-events') {
        loadMyEvents();
    } else if (page === 'my-registrations') {
        loadMyRegistrations();
    }
});

// --- Index Page Logic ---
async function loadEventsIndex(searchQuery = '', filterType = 'all') {
    const grid = document.getElementById('eventsGrid');
    if (!grid) return;

    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color: var(--primary-color);"></i><p style="margin-top: 10px;">Loading events...</p></div>';

    let endpoint = `/events/?search=${encodeURIComponent(searchQuery)}&filter=${filterType}`;
    const res = await apiRequest(endpoint, 'GET');

    if (!res.ok) {
        grid.innerHTML = `<div style="grid-column: 1/-1;" class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h3>Failed to load events</h3><p>${res.data?.detail || 'Unable to connect to server.'}</p></div>`;
        return;
    }

    const events = res.data;
    updateStats(events.length);

    if (events.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1;">
                <div class="empty-state">
                    <i class="fa-solid fa-calendar-xmark"></i>
                    <h3>No Events Found</h3>
                    <p>Try adjusting your search criteria or filter options.</p>
                </div>
            </div>
        `;
        return;
    }

    grid.innerHTML = events.map(event => `
        <div class="event-card">
            <div class="event-card-header">
                <span class="event-card-date">
                    <i class="fa-regular fa-calendar"></i> ${formatDate(event.date)}
                </span>
                <h3 class="event-card-title">${escapeHtml(event.title)}</h3>
            </div>
            <div class="event-card-body">
                <div>
                    <p class="event-card-desc">${escapeHtml(event.description)}</p>
                    <div class="event-card-meta">
                        <div class="event-meta-item"><i class="fa-regular fa-clock"></i> ${formatTime(event.time)}</div>
                        <div class="event-meta-item"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(event.location)}</div>
                        <div class="event-meta-item"><i class="fa-solid fa-user"></i> ${escapeHtml(event.organizer_username)}</div>
                    </div>
                </div>
                <div class="event-card-footer">
                    <a href="event-detail.html?id=${event.id}" class="btn btn-sm btn-outline">Details &rarr;</a>
                    ${renderRegistrationBadgeOrButton(event)}
                </div>
            </div>
        </div>
    `).join('');
}

function renderRegistrationBadgeOrButton(event) {
    if (!currentUser) return '';
    if (event.is_registered) {
        return '<span class="badge badge-success"><i class="fa-solid fa-check"></i> Registered</span>';
    }
    return `<button class="btn btn-sm btn-primary" onclick="quickRegister(${event.id})">Register</button>`;
}

async function quickRegister(eventId) {
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    const res = await apiRequest(`/events/${eventId}/register/`, 'POST');
    if (res.ok) {
        showAlert(res.data.message, 'success');
        loadEventsIndex();
    } else {
        showAlert(res.data.detail || 'Registration failed.', 'error');
    }
}

function setupSearchAndFilter() {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const filterBtns = document.querySelectorAll('.filter-btn');

    let currentFilter = 'all';

    if (searchForm) {
        searchForm.onsubmit = function (e) {
            e.preventDefault();
            loadEventsIndex(searchInput.value, currentFilter);
        };
    }

    filterBtns.forEach(btn => {
        btn.onclick = function (e) {
            e.preventDefault();
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            loadEventsIndex(searchInput ? searchInput.value : '', currentFilter);
        };
    });
}

async function updateStats(totalEventsCount) {
    const totalEl = document.getElementById('totalEventsCount');
    if (totalEl) totalEl.textContent = totalEventsCount;

    if (currentUser) {
        const regRes = await apiRequest('/registrations/', 'GET');
        if (regRes.ok) {
            const regEl = document.getElementById('userRegisteredCount');
            if (regEl) regEl.textContent = regRes.data.length;
        }

        const myEvRes = await apiRequest('/my-events/', 'GET');
        if (myEvRes.ok) {
            const createdEl = document.getElementById('userCreatedCount');
            if (createdEl) createdEl.textContent = myEvRes.data.length;
        }
    }
}

// --- Event Detail Page Logic ---
async function loadEventDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    const container = document.getElementById('eventDetailContainer');

    if (!eventId || !container) return;

    const res = await apiRequest(`/events/${eventId}/`, 'GET');

    if (!res.ok) {
        container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h3>Event Not Found</h3><p>${res.data?.detail || 'Event does not exist.'}</p><a href="index.html" class="btn btn-secondary">&larr; Back to Events</a></div>`;
        return;
    }

    const event = res.data;

    let actionButtons = '';
    if (event.is_organizer) {
        actionButtons = `
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <span class="badge badge-warning" style="text-align: center;"><i class="fa-solid fa-crown"></i> You are the Organizer</span>
                <a href="edit-event.html?id=${event.id}" class="btn btn-primary" style="justify-content: center;"><i class="fa-solid fa-pen-to-square"></i> Edit Event</a>
                <button onclick="handleDeleteEvent(${event.id})" class="btn btn-danger" style="width: 100%; justify-content: center;"><i class="fa-solid fa-trash"></i> Delete Event</button>
            </div>
        `;
    } else if (currentUser) {
        if (event.is_registered) {
            actionButtons = `
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <div class="alert alert-success" style="margin-bottom: 0; text-align: center; justify-content: center;">
                        <i class="fa-solid fa-circle-check"></i> You are Registered!
                    </div>
                    <button onclick="handleCancelRegistration(${event.id})" class="btn btn-secondary" style="width: 100%; justify-content: center;"><i class="fa-solid fa-xmark"></i> Cancel Registration</button>
                </div>
            `;
        } else {
            actionButtons = `
                <button onclick="handleRegisterEvent(${event.id})" class="btn btn-accent" style="width: 100%; justify-content: center;"><i class="fa-solid fa-ticket"></i> Register for Event</button>
            `;
        }
    } else {
        actionButtons = `
            <a href="login.html" class="btn btn-primary" style="justify-content: center;"><i class="fa-solid fa-right-to-bracket"></i> Login to Register</a>
        `;
    }

    container.innerHTML = `
        <div class="event-detail-card">
            <div class="event-detail-header">
                <span class="badge badge-info" style="font-size: 0.9rem; margin-bottom: 15px;">
                    <i class="fa-regular fa-calendar"></i> ${formatDate(event.date)}
                </span>
                <h1>${escapeHtml(event.title)}</h1>
                <p><i class="fa-solid fa-location-dot"></i> ${escapeHtml(event.location)} &bull; Hosted by <strong>${escapeHtml(event.organizer_username)}</strong></p>
            </div>
            <div class="event-detail-body">
                <div class="event-detail-grid">
                    <div>
                        <h3 class="event-section-title">About this Event</h3>
                        <p style="white-space: pre-line; color: var(--dark-color); font-size: 1.05rem; line-height: 1.8;">${escapeHtml(event.description)}</p>
                    </div>
                    <div>
                        <div class="event-info-box">
                            <h3 class="event-section-title">Event Summary</h3>
                            <div class="event-meta-item"><i class="fa-regular fa-calendar"></i><div><strong>Date</strong><br><span>${formatDate(event.date)}</span></div></div>
                            <div class="event-meta-item"><i class="fa-regular fa-clock"></i><div><strong>Time</strong><br><span>${formatTime(event.time)}</span></div></div>
                            <div class="event-meta-item"><i class="fa-solid fa-location-dot"></i><div><strong>Venue</strong><br><span>${escapeHtml(event.location)}</span></div></div>
                            <div class="event-meta-item"><i class="fa-solid fa-user-group"></i><div><strong>Registered Attendees</strong><br><span>${event.registration_count} participants</span></div></div>
                            <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 10px 0;">
                            ${actionButtons}
                        </div>
                    </div>
                </div>
                <div style="margin-top: 30px; border-top: 1px solid var(--border-color); padding-top: 20px;">
                    <a href="index.html" class="btn btn-secondary">&larr; Back to Events</a>
                </div>
            </div>
        </div>
    `;
}

async function handleRegisterEvent(eventId) {
    const res = await apiRequest(`/events/${eventId}/register/`, 'POST');
    if (res.ok) {
        showAlert(res.data.message, 'success');
        loadEventDetail();
    } else {
        showAlert(res.data.detail || 'Registration failed.', 'error');
    }
}

async function handleCancelRegistration(eventId) {
    const res = await apiRequest(`/events/${eventId}/cancel/`, 'POST');
    if (res.ok) {
        showAlert(res.data.message, 'info');
        loadEventDetail();
    } else {
        showAlert(res.data.detail || 'Cancellation failed.', 'error');
    }
}

async function handleDeleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    const res = await apiRequest(`/events/${eventId}/`, 'DELETE');
    if (res.ok) {
        window.location.href = 'my-events.html';
    } else {
        showAlert(res.data.detail || 'Deletion failed.', 'error');
    }
}

// --- Create Event Logic ---
function setupCreateEventForm() {
    const form = document.getElementById('createEventForm');
    if (!form) return;

    form.onsubmit = async function (e) {
        e.preventDefault();

        const data = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            location: document.getElementById('location').value
        };

        const res = await apiRequest('/events/', 'POST', data);

        if (res.ok) {
            window.location.href = `event-detail.html?id=${res.data.id}`;
        } else {
            showFormErrors(res.data);
        }
    };
}

// --- Edit Event Logic ---
async function loadAndSetupEditEventForm() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    const form = document.getElementById('editEventForm');

    if (!eventId || !form) return;

    const res = await apiRequest(`/events/${eventId}/`, 'GET');
    if (!res.ok) {
        showAlert(res.data?.detail || 'Event not found.', 'error');
        return;
    }

    const event = res.data;

    document.getElementById('title').value = event.title;
    document.getElementById('description').value = event.description;
    document.getElementById('date').value = event.date;
    document.getElementById('time').value = event.time;
    document.getElementById('location').value = event.location;

    form.onsubmit = async function (e) {
        e.preventDefault();

        const updatedData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            location: document.getElementById('location').value
        };

        const updateRes = await apiRequest(`/events/${eventId}/`, 'PUT', updatedData);

        if (updateRes.ok) {
            window.location.href = `event-detail.html?id=${eventId}`;
        } else {
            showFormErrors(updateRes.data);
        }
    };
}

// --- My Events Logic ---
async function loadMyEvents() {
    const tbody = document.getElementById('myEventsTbody');
    const container = document.getElementById('myEventsContainer');

    if (!tbody || !container) return;

    const res = await apiRequest('/my-events/', 'GET');

    if (!res.ok) {
        container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h3>Failed to load your events</h3><p>${res.data?.detail || 'Error fetching events.'}</p></div>`;
        return;
    }

    const events = res.data;

    if (events.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="margin: 40px 0;">
                <i class="fa-solid fa-calendar-plus"></i>
                <h3>No Events Created Yet</h3>
                <p>You haven't hosted any events. Start organizing one today!</p>
                <a href="create-event.html" class="btn btn-primary"><i class="fa-solid fa-plus"></i> Create Your First Event</a>
            </div>
        `;
        return;
    }

    tbody.innerHTML = events.map(event => `
        <tr>
            <td><strong><a href="event-detail.html?id=${event.id}" style="color: var(--primary-color); text-decoration: none;">${escapeHtml(event.title)}</a></strong></td>
            <td>${formatDate(event.date)} at ${formatTime(event.time)}</td>
            <td>${escapeHtml(event.location)}</td>
            <td><span class="badge badge-info"><i class="fa-solid fa-user-group"></i> ${event.registration_count} registered</span></td>
            <td style="text-align: right;">
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <a href="event-detail.html?id=${event.id}" class="btn btn-sm btn-outline"><i class="fa-solid fa-eye"></i> View</a>
                    <a href="edit-event.html?id=${event.id}" class="btn btn-sm btn-secondary"><i class="fa-solid fa-pen-to-square"></i> Edit</a>
                    <button onclick="handleDeleteEventFromList(${event.id})" class="btn btn-sm btn-danger"><i class="fa-solid fa-trash"></i> Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function handleDeleteEventFromList(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    const res = await apiRequest(`/events/${eventId}/`, 'DELETE');
    if (res.ok) {
        loadMyEvents();
    } else {
        showAlert(res.data.detail || 'Delete failed.', 'error');
    }
}

// --- My Registrations Logic ---
async function loadMyRegistrations() {
    const tbody = document.getElementById('myRegistrationsTbody');
    const container = document.getElementById('myRegistrationsContainer');

    if (!tbody || !container) return;

    const res = await apiRequest('/registrations/', 'GET');

    if (!res.ok) {
        container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h3>Failed to load registrations</h3><p>${res.data?.detail || 'Error fetching registrations.'}</p></div>`;
        return;
    }

    const registrations = res.data;

    if (registrations.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="margin: 40px 0;">
                <i class="fa-solid fa-ticket"></i>
                <h3>No Event Registrations Found</h3>
                <p>You haven't registered for any events yet. Explore upcoming campus events and join in!</p>
                <a href="index.html" class="btn btn-primary"><i class="fa-solid fa-compass"></i> Browse Events</a>
            </div>
        `;
        return;
    }

    tbody.innerHTML = registrations.map(reg => `
        <tr>
            <td><strong><a href="event-detail.html?id=${reg.event_detail.id}" style="color: var(--primary-color); text-decoration: none;">${escapeHtml(reg.event_detail.title)}</a></strong></td>
            <td>${escapeHtml(reg.event_detail.organizer_username)}</td>
            <td>${formatDate(reg.event_detail.date)} at ${formatTime(reg.event_detail.time)}</td>
            <td>${escapeHtml(reg.event_detail.location)}</td>
            <td><span class="badge badge-success">${formatDate(reg.registered_at)}</span></td>
            <td style="text-align: right;">
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <a href="event-detail.html?id=${reg.event_detail.id}" class="btn btn-sm btn-outline"><i class="fa-solid fa-eye"></i> View</a>
                    <button onclick="handleCancelRegFromList(${reg.event_detail.id})" class="btn btn-sm btn-secondary"><i class="fa-solid fa-xmark"></i> Cancel</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function handleCancelRegFromList(eventId) {
    const res = await apiRequest(`/events/${eventId}/cancel/`, 'POST');
    if (res.ok) {
        loadMyRegistrations();
    } else {
        showAlert(res.data.detail || 'Cancellation failed.', 'error');
    }
}

// Utility Helpers
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
}

function showFormErrors(errorData) {
    const errorBox = document.getElementById('formErrors');
    if (!errorBox) return;

    if (typeof errorData === 'object') {
        let messages = [];
        for (let key in errorData) {
            let val = errorData[key];
            if (Array.isArray(val)) {
                messages.push(`${key}: ${val.join(', ')}`);
            } else {
                messages.push(`${key}: ${val}`);
            }
        }
        errorBox.innerHTML = `<div class="alert alert-danger">${messages.join('<br>')}</div>`;
    } else {
        errorBox.innerHTML = `<div class="alert alert-danger">${errorData || 'An error occurred.'}</div>`;
    }
}
