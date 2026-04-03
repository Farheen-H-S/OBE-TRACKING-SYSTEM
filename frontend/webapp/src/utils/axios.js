import axios from "axios";

const api = axios.create({
    baseURL: "https://obe-tracking-system.onrender.com/api/",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        // Skip auth headers for public/auth routes
        const isPublic =
            config.url.includes("/users/login") ||
            config.url.includes("/users/logout") ||
            config.url.includes("/users/token/refresh");

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

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes("/users/login")) {

            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = 'Bearer ' + token;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem("refresh") || sessionStorage.getItem("refresh");

            if (!refreshToken) {
                console.error("No refresh token available. Logging out.");
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = "/";
                return Promise.reject(error);
            }

            try {
                // Call token refresh endpoint directly using pure axios to avoid interceptor loop
                const res = await axios.post("https://obe-tracking-system.onrender.com/api/users/token/refresh/", {
                    refresh: refreshToken
                });

                const newAccessToken = res.data.access;

                // Update storage where the refresh token was originally found
                if (localStorage.getItem("refresh")) {
                    localStorage.setItem("access", newAccessToken);
                    if (res.data.refresh) localStorage.setItem("refresh", res.data.refresh);
                } else {
                    sessionStorage.setItem("access", newAccessToken);
                    if (res.data.refresh) sessionStorage.setItem("refresh", res.data.refresh);
                }

                api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                processQueue(null, newAccessToken);
                return api(originalRequest);

            } catch (refreshError) {
                processQueue(refreshError, null);
                console.error("Refresh token expired. Logging out.");
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = "/";
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
