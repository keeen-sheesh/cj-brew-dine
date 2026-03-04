import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Function to get CSRF token from meta tag
const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
};

// Function to refresh CSRF token by fetching a new one from the server
const refreshCsrfToken = async () => {
    try {
        // Fetch a fresh CSRF token from Laravel
        const response = await axios.get('/csrf-token', {
            headers: {
                'Accept': 'application/json',
            }
        });
        
        const newToken = response.data.token;
        
        if (newToken) {
            // Update the meta tag
            let metaTag = document.querySelector('meta[name="csrf-token"]');
            if (!metaTag) {
                metaTag = document.createElement('meta');
                metaTag.name = 'csrf-token';
                document.head.appendChild(metaTag);
            }
            metaTag.setAttribute('content', newToken);
            
            // Update axios defaults
            axios.defaults.headers.common['X-CSRF-TOKEN'] = newToken;
            return newToken;
        }
        return null;
    } catch (error) {
        console.error('Failed to refresh CSRF token:', error);
        return null;
    }
};

// Set initial CSRF token
let csrfToken = getCsrfToken();
if (csrfToken) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
}

// Add response interceptor to handle 419 errors
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 419 CSRF token mismatch and we haven't retried yet
        if (error.response?.status === 419 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Refresh CSRF token
            await refreshCsrfToken();

            // Retry the original request with new token
            const newToken = getCsrfToken();
            if (newToken) {
                originalRequest.headers['X-CSRF-TOKEN'] = newToken;
            }
            return axios(originalRequest);
        }

        return Promise.reject(error);
    }
);
