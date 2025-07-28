// zerobill/frontend/src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  // This is the essential setting that tells the browser to
  // automatically send the httpOnly cookie with every request.
  withCredentials: true 
});

// The old interceptor that manually added the Authorization header is no longer needed.

export default api;