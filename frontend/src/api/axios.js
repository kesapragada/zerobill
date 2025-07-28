// zerobill/frontend/src/api/axios.js

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  // [SECURITY FIX] This tells axios to include cookies in requests to the backend.
  withCredentials: true 
});

// The old request interceptor for setting the 'Authorization' header is no longer needed
// because the browser now handles the secure cookie automatically.

export default api;