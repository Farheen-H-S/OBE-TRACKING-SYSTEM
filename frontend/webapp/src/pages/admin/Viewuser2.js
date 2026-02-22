import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Viewuser2.css';
import { profile } from '../../assets/images';
import { celebImg } from '../../assets/images';
import api from '../../utils/axios';

const Viewuser2 = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showStatusPopup, setShowStatusPopup] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // 'enable' or 'disable'
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        let userId = queryParams.get('id');

        const loggedInUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
        const role = (loggedInUser?.role || loggedInUser?.role_name || "").toUpperCase();
        const isAdmin = role === 'ADMIN';

        // If NOT admin AND userId matches self, use /profile/ endpoint to avoid 403
        if (userId && String(userId) === String(loggedInUser?.user_id)) {
            userId = "profile";
        }

        // If no ID in query params, we fetch the logged-in user's own profile
        if (!userId || userId === "profile") {
            console.log("Profile lookup - Fetching own profile via /users/profile/");
            fetchUser("profile");
        } else {
            console.log("Profile lookup - Fetching user by ID:", userId);
            fetchUser(userId);
        }
    }, [location]);

    const fetchUser = async (id) => {
        setLoading(true);
        try {
            const endpoint = id === "profile" ? "/users/profile/" : `/users/${id}/`;
            const response = await api.get(endpoint);
            console.log("Fetch user success:", response.data);
            setUser(response.data);
        } catch (error) {
            console.error("Error fetching user details:", id, error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const handleActionClick = (action) => {
        setPendingAction(action);
        setShowStatusPopup(true);
    };

    const handleConfirmAction = async () => {
        try {
            if (pendingAction === 'disable') {
                await api.delete(`/users/${user.user_id}/`);
            } else {
                await api.put(`/users/${user.user_id}/`, { is_active: true });
            }
            setShowStatusPopup(false);
            setShowSuccessPopup(true);
        } catch (error) {
            console.error(`Error ${pendingAction}ing user:`, error);
            alert(`Failed to ${pendingAction} user.`);
        }
    };

    const handleCancelAction = () => {
        setShowStatusPopup(false);
        setPendingAction(null);
    };

    const handleCloseSuccessPopup = () => {
        setShowSuccessPopup(false);
        fetchUser(user.user_id); // Refresh user data to show updated status
    };

    const handleUpdateClick = () => {
        navigate(`/update-user?id=${user.user_id}`);
    };

    const handleBackClick = () => {
        const loggedInUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
        const role = (loggedInUser?.role || loggedInUser?.role_name || "").toUpperCase();

        if (role === 'ADMIN') {
            navigate('/view-user');
        } else {
            navigate('/dashboard');
        }
    };

    const loggedInUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
    const role = (loggedInUser?.role || loggedInUser?.role_name || "").toUpperCase();

    return (
        <div className="view-user2-container p-5 bg-white h-100 overflow-y-auto">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold m-0 profile-heading">Profile</h2>
                <button onClick={handleBackClick} className="btn btn-outline-secondary px-4 fw-bold">Back</button>
            </div>

            {loading ? (
                <div className="text-center py-5">Loading user details...</div>
            ) : user ? (
                <>
                    <div className="d-flex flex-column flex-md-row gap-4 align-items-start">
                        {/* Profile Card */}
                        <div className="p-4 rounded shadow-sm text-center profile-card d-flex flex-column align-items-center justify-content-center">
                            <div className="mb-4">
                                <img
                                    src={user.profile_picture ? (user.profile_picture.startsWith('http') ? user.profile_picture : `http://127.0.0.1:8000${user.profile_picture.startsWith('/') ? '' : '/'}${user.profile_picture}`) : profile}
                                    alt={user.name}
                                    className="rounded-circle profile-img border border-3 border-white shadow-sm"
                                    style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                />
                            </div>

                            <div className="text-start w-100 ps-5">
                                <div className="mb-1 fw-bold fs-5 inter-heading">
                                    <p>User ID : {user.user_id}</p>
                                    <p>Name : {user.name}</p>
                                    <p>Username : {user.email}</p>
                                    <p>Contact : {user.contact_no || 'N/A'}</p>
                                    <p>Role : {user.role_name}</p>
                                    <p>Department : {user.department_name || 'N/A'}</p>
                                    <p>Date of Joining : {user.date_of_joining || 'N/A'}</p>
                                    <p>Status : <span className={`status-badge ${user.is_active ? 'status-active' : 'status-inactive'}`}>
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </span></p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="d-flex flex-column gap-3 mt-md-0 mt-3 pt-md-5 justify-content-center">
                            <button onClick={handleUpdateClick} className="btn btn-action fw-bold px-4 py-2 border w-100 shadow-sm">
                                {user.user_id === loggedInUser?.user_id ? 'Edit Profile' : 'Update'}
                            </button>
                            {user.is_active ? (
                                // Hide disable button if user is viewing their own profile
                                user.user_id !== JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}').user_id && (
                                    <button
                                        onClick={() => handleActionClick('disable')}
                                        className="btn btn-danger fw-bold px-4 py-2 border w-100"
                                        style={{ backgroundColor: '#dc3545', color: 'white' }}
                                    >
                                        Disable user
                                    </button>
                                )
                            ) : (
                                <button
                                    onClick={() => handleActionClick('enable')}
                                    className="btn btn-success fw-bold px-4 py-2 border w-100"
                                    style={{ backgroundColor: '#28a745', color: 'white' }}
                                >
                                    Enable user
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Confirmation Popup */}
                    {showStatusPopup && (
                        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', zIndex: 1050 }}>
                            <div className="bg-white p-5 rounded d-flex flex-column align-items-center justify-content-center text-center shadow-sm"
                                style={{
                                    border: '2px solid #4285F4',
                                    maxWidth: '600px',
                                    width: '90%',
                                    minHeight: '300px'
                                }}>
                                <h3 className="mb-5 fw-bold" style={{ color: '#2C3E50' }}>
                                    Are you sure to {pendingAction} this user?
                                </h3>
                                <div className="d-flex gap-5">
                                    <button onClick={handleConfirmAction} className="btn btn-primary px-5 py-2 fw-semibold" style={{ backgroundColor: '#4285F4', border: 'none' }}>Yes</button>
                                    <button onClick={handleCancelAction} className="btn btn-primary px-5 py-2 fw-semibold" style={{ backgroundColor: '#4285F4', border: 'none' }}>No</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Success Popup */}
                    {showSuccessPopup && (
                        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                            <div className="bg-white p-5 rounded shadow d-flex flex-column align-items-center justify-content-center text-center" style={{ maxWidth: '700px', width: '90%', minHeight: '400px' }}>
                                <h3 className="mb-4 text-primary fw-bold" style={{ color: '#3f51b5' }}>
                                    User has been successfully {pendingAction === 'disable' ? 'disabled' : 'enabled'}
                                </h3>
                                <div className="mb-4">
                                    <img src={celebImg} alt="Celebration" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
                                </div>
                                <button onClick={handleCloseSuccessPopup} className="btn btn-primary px-4 py-2" style={{ backgroundColor: '#4285f4', border: 'none', borderRadius: '4px' }}>OK</button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-5 text-danger">User not found.</div>
            )}
        </div>
    );
};

export default Viewuser2;
