import api from "../utils/axios";

// Login function
export const login = async (email, password) => {
    const response = await api.post("users/login/", {
        email,
        password,
    });
    return response.data;
};

// Logout function
export const logout = async (refreshToken) => {
    const response = await api.post("users/logout/", { refresh: refreshToken });
    return response.data;
};
