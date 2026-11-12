// services/apiClient.js (formerly api.js)
// Responsibility: create ONE Axios instance that every page uses to talk to
// the backend, and attach the JWT token automatically to each request.

import axios from "axios";

// The backend URL comes from the frontend env file (VITE_API_URL).
//   - Local development: falls back to the local backend on port 5000.
//   - Production (Vercel): VITE_API_URL must be set in the project
//     settings. There is no localhost in a user's browser, so a missing
//     value produces an empty base URL and a clear console error.
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "");

// Loud warning if a production build was made without VITE_API_URL.
if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
  console.error(
    "[apiClient] VITE_API_URL is not set. Add it to the Vercel project settings (frontend) and redeploy."
  );
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Before every request, if we have a saved token, add it to the headers.
api.interceptors.request.use(function (config) {
  const token = localStorage.getItem("sra_token");

  if (token) {
    config.headers.Authorization = "Bearer " + token;
  }

  return config;
});

// Turn any Axios error into a simple, readable message for the UI.
export function getErrorMessage(error) {
  if (error.response && error.response.data) {
    const data = error.response.data;

    // Zod validation errors arrive as an "errors" array.
    if (data.errors && data.errors.length > 0) {
      return data.errors.join(", ");
    }

    if (data.message) {
      return data.message;
    }
  }

  if (error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export default api;
