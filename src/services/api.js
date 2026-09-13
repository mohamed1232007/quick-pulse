import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api",
    withCredentials: true,
});

API.interceptors.request.use((config) => {
    const csrfToken = sessionStorage.getItem("quickpulse_csrf")
        || document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith("quickpulse_csrf="))
        ?.split("=")[1];
    if (csrfToken && ["post", "put", "patch", "delete"].includes(config.method?.toLowerCase())) {
        config.headers["X-CSRF-Token"] = decodeURIComponent(csrfToken);
    }
    return config;
});

export default API;
