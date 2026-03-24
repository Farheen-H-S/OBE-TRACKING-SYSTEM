import api from "../utils/axios";

// Login function
export const login = async (email, password) => {
    const response = await api.post("/users/login/", { email, password });

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
        const response = await api.post("/users/logout/", { refresh: refreshToken });
        // Clear storage
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");
        localStorage.removeItem("obe_academic_context");
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
    const user = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!user) return null;

    try {
        return JSON.parse(user);
    } catch (err) {
        console.error("Failed to parse user from storage:", err);
        return null;
    }
};

// Utility to update logged-in user info in storage
export const updateLoggedInUser = (userData) => {
    if (!userData) return;

    if (localStorage.getItem("user")) {
        localStorage.setItem("user", JSON.stringify(userData));
    } else if (sessionStorage.getItem("user")) {
        sessionStorage.setItem("user", JSON.stringify(userData));
    }
};
