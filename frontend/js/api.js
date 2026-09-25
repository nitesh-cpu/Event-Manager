// Global API Base Configuration
const API_BASE_URL = 'https://event-manager-backend-jtze.onrender.com/api';

// Helper to get CSRF token from cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Universal API Request Wrapper
async function apiRequest(endpoint, method = 'GET', bodyData = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
    }

    const config = {
        method: method,
        headers: headers,
        credentials: 'include' // Important for Django Session Authentication
    };

    if (bodyData && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.body = JSON.stringify(bodyData);
    }

    try {
        const response = await fetch(url, config);
        const isJson = response.headers.get('content-type')?.includes('application/json');
        const data = isJson ? await response.json() : null;

        return {
            ok: response.ok,
            status: response.status,
            data: data
        };
    } catch (error) {
        console.error('Network/API Error:', error);
        return {
            ok: false,
            status: 0,
            data: { detail: 'Network error. Please make sure the backend server is running.' }
        };
    }
}
