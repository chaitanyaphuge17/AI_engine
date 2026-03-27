import axios from 'axios';

// Cross-connecting the environment for Cloudflare & Render.
// If VITE_API_BASE_URL is defined (e.g., in Cloudflare settings), uses that.
// Otherwise, defaults to local development backend.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

export default api;
