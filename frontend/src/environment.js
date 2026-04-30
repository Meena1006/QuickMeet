// ================================================================================
// Environment Configuration for QuickMeet Pro
// ================================================================================
// This file determines which backend server the frontend connects to.
// It supports both local development and production deployment.
// ================================================================================

// PRODUCTION BACKEND URL - Change this if your backend URL changes
const PRODUCTION_BACKEND_URL = "https://quickmeet-ava8.onrender.com";

// DEVELOPMENT BACKEND URL
const DEVELOPMENT_BACKEND_URL = "http://localhost:8000";

// Get the appropriate server URL based on environment
// Priority: 1) REACT_APP_API_URL env var, 2) NODE_ENV check, 3) hostname check
const getServerUrl = () => {
  // 1. Check for custom API URL via environment variable (highest priority - most reliable)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 2. Check if running in production mode (set by React during build)
  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_BACKEND_URL;
  }
  
  // 3. Check if we're running on a non-localhost domain (fallback for production)
  // This handles cases where NODE_ENV is not properly set
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // If not on localhost or 127.0.0.1, assume production
    if (!hostname.includes("localhost") && !hostname.includes("127.0.0.1")) {
      return PRODUCTION_BACKEND_URL;
    }
  }
  
  // 4. Default to local development
  return DEVELOPMENT_BACKEND_URL;
};

const server = getServerUrl();

// Export for debugging - you can remove this in production
// console.log("Current server URL:", server);
// console.log("NODE_ENV:", process.env.NODE_ENV);

export default server;
