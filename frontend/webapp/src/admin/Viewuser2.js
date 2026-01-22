
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Adminhead from '../components/header/Adminhead';
import Adminside from '../components/sidebar/Adminside';
import './Viewuser2.css';
import profilePic from './profile.jpeg';
import celebImg from './celeb.jpg';

const Viewuser2 = () => {
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const navigate = useNavigate();

    const handleDeleteClick = () => {
        setShowDeletePopup(true);
    };

    const handleConfirmDelete = () => {
        // Logic to delete user goes here
        setShowDeletePopup(false);
        setShowSuccessPopup(true); // Show success popup after confirming
    };

    const handleCancelDelete = () => {
        setShowDeletePopup(false);
    };

    const handleCloseSuccessPopup = () => {
        setShowSuccessPopup(false);
    };

    const handleUpdateClick = () => {
        navigate('/update-user');
    };

    return (
        <div className="d-flex flex-column vh-100 position-relative">
            <Adminhead />

            <div className="d-flex flex-grow-1 overflow-hidden">
                <div className="h-100 overflow-y-auto sidebar-wrapper">
                    <Adminside />
                </div>

                <div className="flex-grow-1 p-5 bg-white overflow-y-auto">
                    <h2 className="fw-bold mb-4 profile-heading">Profile</h2>

                    <div className="d-flex flex-column flex-md-row gap-4 align-items-start">
                        {/* Profile Card */}
                        <div className="p-4 rounded shadow-sm text-center profile-card d-flex flex-column align-items-center justify-content-center">
                            <div className="mb-4">
                                <img
                                    src={profilePic}
                                    alt="Mitesh Vinod Pawar"
                                    className="rounded-circle profile-img border border-3 border-white shadow-sm"
                                />
                            </div>

                            <div className="text-start w-100 ps-5">
                                <div className="mb-1 fw-bold fs-5  inter-heading">
                                    <p>Name : Mitesh Vinod Pawar</p>
                                    <p>DOB : 20/09/2001</p>
                                    <p>Admin ID : 302023015</p>
                                    <p>College : SP</p>
                                    <p>Admitted in : 2023-24</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="d-flex flex-column gap-3 mt-md-0 mt-3 pt-5 justify-content-center">
                            <button onClick={handleUpdateClick} className="btn btn-action fw-bold px-4 py-2 border w-100">Update user</button>
                            <button onClick={handleDeleteClick} className="btn btn-action fw-bold px-4 py-2 border w-100">Delete user</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Popup */}
            {/* Delete Confirmation Popup */}
            {showDeletePopup && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', zIndex: 1050 }}>
                    <div className="bg-white p-5 rounded d-flex flex-column align-items-center justify-content-center text-center shadow-sm"
                        style={{
                            border: '2px solid #4285F4',
                            maxWidth: '600px',
                            width: '90%',
                            minHeight: '300px'
                        }}>
                        <h3 className="mb-5 fw-bold" style={{ color: '#2C3E50' }}>Are you sure to delete this user ?</h3>
                        <div className="d-flex gap-5">
                            <button onClick={handleConfirmDelete} className="btn btn-primary px-5 py-2 fw-semibold" style={{ backgroundColor: '#4285F4', border: 'none' }}>Yes</button>
                            <button onClick={handleCancelDelete} className="btn btn-primary px-5 py-2 fw-semibold" style={{ backgroundColor: '#4285F4', border: 'none' }}>No</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Popup */}
            {/* Success Popup */}
            {showSuccessPopup && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                    <div className="bg-white p-5 rounded shadow d-flex flex-column align-items-center justify-content-center text-center" style={{ maxWidth: '700px', width: '90%', minHeight: '400px' }}>
                        <h3 className="mb-4 text-primary fw-bold" style={{ color: '#3f51b5' }}>User with username 312023046 has been successfully deleted</h3>
                        <div className="mb-4">
                            <img src={celebImg} alt="Celebration" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
                        </div>
                        <button onClick={handleCloseSuccessPopup} className="btn btn-primary px-4 py-2" style={{ backgroundColor: '#4285f4', border: 'none', borderRadius: '4px' }}>OK</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Viewuser2;
