// Authentication state management and UI updating

let currentUser = null;

async function checkAuthStatus() {
    const res = await apiRequest('/user/', 'GET');
    if (res.ok && res.data && res.data.is_authenticated) {
        currentUser = res.data.user;
    } else {
        currentUser = null;
    }
    updateNavbarUI();
    return currentUser;
}

function updateNavbarUI() {
    const navLinksContainer = document.getElementById('navLinks');
    const headerActionsContainer = document.getElementById('headerActions');
    const mobileNavLinksContainer = document.getElementById('mobileNavLinks');

    const currentPath = window.location.pathname;

    if (currentUser) {
        // Logged-in navigation links
        if (navLinksContainer) {
            navLinksContainer.innerHTML = `
                <li><a href="index.html" class="${currentPath.includes('index.html') || currentPath.endsWith('/') ? 'active' : ''}"><i class="fa-solid fa-house"></i> Home</a></li>
                <li><a href="create-event.html" class="${currentPath.includes('create-event') ? 'active' : ''}"><i class="fa-solid fa-plus-circle"></i> Create Event</a></li>
                <li><a href="my-events.html" class="${currentPath.includes('my-events') ? 'active' : ''}"><i class="fa-solid fa-list-check"></i> My Events</a></li>
                <li><a href="my-registrations.html" class="${currentPath.includes('my-registrations') ? 'active' : ''}"><i class="fa-solid fa-ticket"></i> My Registrations</a></li>
            `;
        }

        if (headerActionsContainer) {
            headerActionsContainer.innerHTML = `
                <span class="user-badge"><i class="fa-solid fa-user"></i> ${currentUser.username}</span>
                <button id="logoutBtn" class="btn btn-sm btn-accent"><i class="fa-solid fa-sign-out-alt"></i> Logout</button>
                <button class="mobile-toggle" id="mobileToggle"><i class="fa-solid fa-bars"></i></button>
            `;

            document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
        }

        if (mobileNavLinksContainer) {
            mobileNavLinksContainer.innerHTML = `
                <li><a href="index.html"><i class="fa-solid fa-house"></i> Home</a></li>
                <li><a href="create-event.html"><i class="fa-solid fa-plus-circle"></i> Create Event</a></li>
                <li><a href="my-events.html"><i class="fa-solid fa-list-check"></i> My Events</a></li>
                <li><a href="my-registrations.html"><i class="fa-solid fa-ticket"></i> My Registrations</a></li>
                <li><button id="mobileLogoutBtn" class="btn btn-danger btn-sm" style="width: 100%;"><i class="fa-solid fa-sign-out-alt"></i> Logout</button></li>
            `;

            document.getElementById('mobileLogoutBtn')?.addEventListener('click', handleLogout);
        }
    } else {
        // Guest navigation links
        if (navLinksContainer) {
            navLinksContainer.innerHTML = `
                <li><a href="index.html" class="${currentPath.includes('index.html') || currentPath.endsWith('/') ? 'active' : ''}"><i class="fa-solid fa-house"></i> Home</a></li>
            `;
        }

        if (headerActionsContainer) {
            headerActionsContainer.innerHTML = `
                <a href="login.html" class="btn btn-sm btn-outline" style="color: white; border-color: white;"><i class="fa-solid fa-right-to-bracket"></i> Login</a>
                <a href="register.html" class="btn btn-sm btn-accent"><i class="fa-solid fa-user-plus"></i> Register</a>
                <button class="mobile-toggle" id="mobileToggle"><i class="fa-solid fa-bars"></i></button>
            `;
        }

        if (mobileNavLinksContainer) {
            mobileNavLinksContainer.innerHTML = `
                <li><a href="index.html"><i class="fa-solid fa-house"></i> Home</a></li>
                <li><a href="login.html"><i class="fa-solid fa-right-to-bracket"></i> Login</a></li>
                <li><a href="register.html"><i class="fa-solid fa-user-plus"></i> Register</a></li>
            `;
        }
    }

    setupMobileNavToggle();
}

function setupMobileNavToggle() {
    const mobileToggle = document.getElementById('mobileToggle');
    const mobileNav = document.getElementById('mobileNav');
    const closeMobileNav = document.getElementById('closeMobileNav');

    if (mobileToggle && mobileNav) {
        mobileToggle.onclick = () => mobileNav.classList.add('active');
    }
    if (closeMobileNav && mobileNav) {
        closeMobileNav.onclick = () => mobileNav.classList.remove('active');
    }
}

async function handleLogout() {
    const res = await apiRequest('/logout/', 'POST');
    if (res.ok) {
        window.location.href = 'index.html';
    } else {
        showAlert(res.data?.detail || 'Logout failed.', 'error');
    }
}

// Alert messaging helper
function showAlert(message, type = 'info') {
    const container = document.getElementById('alertContainer');
    if (!container) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <span><i class="fa-solid fa-info-circle"></i> ${message}</span>
        <button class="alert-close">&times;</button>
    `;

    alert.querySelector('.alert-close').onclick = () => alert.remove();
    container.appendChild(alert);

    setTimeout(() => {
        if (alert.parentNode) alert.remove();
    }, 4000);
}

document.addEventListener('DOMContentLoaded', checkAuthStatus);
