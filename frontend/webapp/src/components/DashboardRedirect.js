import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLoggedInUser } from '../utils/auth';

const DashboardRedirect = () => {
    const navigate = useNavigate();
    const user = getLoggedInUser();

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }

        const role = (user.role || user.role_name || "").toUpperCase();
        if (role === 'ADMIN') {
            navigate('/admin-dashboard');
        } else if (role === 'HOD') {
            navigate('/hod-dashboard');
        } else if (role === 'FACULTY') {
            navigate('/faculty-dashboard');
        } else if (role === 'COORDINATOR') {
            navigate('/hod-dashboard');
        } else if (role === 'AUDITOR') {
            navigate('/peo-po-pso');
        } else {
            navigate('/profile');
        }
    }, [navigate, user]);

    return <div>Redirecting to your dashboard...</div>;
};

export default DashboardRedirect;
