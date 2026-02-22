import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
        if (user && user.user_id) {
            navigate(`/view-user2?id=${user.user_id}`, { replace: true });
        } else {
            // Fallback to general profile endpoint
            navigate('/view-user2', { replace: true });
        }
    }, [navigate]);

    return (
        <div className="text-center py-5">
            Loading profile...
        </div>
    );
};

export default Profile;
