// services/authService.js
import api from "../utils/axios";

// Login function
export const login = async (email, password) => {
    const response = await api.post("users/login/", { email, password });

    // Store tokens
    localStorage.setItem("access", response.data.access);
    localStorage.setItem("refresh", response.data.refresh);

    // Store user info
    localStorage.setItem("user", JSON.stringify(response.data.user));

    return response.data;
};

// Logout function
export const logout = async (refreshToken) => {
    try {
        const response = await api.post("users/logout/", { refresh: refreshToken });
        // Clear localStorage/sessionStorage
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");
        sessionStorage.removeItem("access");
        sessionStorage.removeItem("refresh");
        sessionStorage.removeItem("user");
        return response.data;
    } catch (error) {
        console.error("Logout failed:", error);
        throw error;
    }
};

// Utility to get logged-in user
export const getLoggedInUser = () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
};
