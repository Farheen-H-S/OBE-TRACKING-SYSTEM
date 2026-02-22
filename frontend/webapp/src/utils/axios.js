import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api/",
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor to attach JWT except for public endpoints
api.interceptors.request.use(
    (config) => {
        // Skip auth headers for login/logout endpoints
        const isPublic =
            config.url.includes("/users/login") ||
            config.url.includes("/users/logout");

        if (!isPublic) {
            const token =
                localStorage.getItem("access") ||
                sessionStorage.getItem("access");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.error("Unauthorized access, redirecting to login...");
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "/";
        }
        return Promise.reject(error);
    }
);

export default api;
