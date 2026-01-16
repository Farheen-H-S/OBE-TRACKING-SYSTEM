// utils/auth.js

export const getLoggedInUser = () => {
    // Try getting user from localStorage or sessionStorage
    const user = localStorage.getItem("user") || sessionStorage.getItem("user");

    if (!user) return null;

    try {
        return JSON.parse(user); // full user object: user_id, name, email, role
    } catch (err) {
        console.error("Failed to parse user from storage:", err);
        return null;
    }
};
