import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api';
import './Login.css';
import { logo } from '../../assets/images';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

function ResetPassword() {
    const { uidb64, token } = useParams();
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleResetPassword = async () => {
        setError("");
        setMessage("");

        if (!newPassword || !confirmPassword) {
            setError("Please fill in all fields.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        // Add additional password strength validation if needed

        setLoading(true);

        try {
            // POST the uidb64, token, and new password to the backend endpoint
            const response = await api.post('/users/auth/reset-password/', {
                uidb64,
                token,
                new_password: newPassword
            });

            setMessage(response.data.message || "Password updated successfully.");
            // Clear out fields
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || "Invalid or expired token. Please request a new link.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrapper d-flex justify-content-center align-items-center vh-100">
            <div className="login-card card border-0 p-4">

                {/* Logo */}
                <div className="text-center mb-3">
                    <img src={logo} alt="Logo" className="login-logo img-fluid" style={{ maxWidth: '120px' }} />
                </div>

                <h4 className="login-title text-center mb-4">Reset Password</h4>

                {/* New Password */}
                <div className="mb-3 position-relative">
                    <div className="input-group">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="New Password"
                            className="form-control input-box border-end-0 shadow-none"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, background: '#eef8ff', borderColor: '#cfe2f3' }}
                        />
                        <span
                            className="input-group-text border-start-0 cursor-pointer shadow-none"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                borderTopLeftRadius: 0,
                                borderBottomLeftRadius: 0,
                                background: '#eef8ff',
                                borderColor: '#cfe2f3',
                                color: '#666'
                            }}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>
                    </div>
                </div>

                {/* Confirm Password */}
                <div className="mb-4 position-relative">
                    <div className="input-group">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm Password"
                            className="form-control input-box border-end-0 shadow-none"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, background: '#eef8ff', borderColor: '#cfe2f3' }}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleResetPassword(); }}
                        />
                        <span
                            className="input-group-text border-start-0 cursor-pointer shadow-none"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{
                                borderTopLeftRadius: 0,
                                borderBottomLeftRadius: 0,
                                background: '#eef8ff',
                                borderColor: '#cfe2f3',
                                color: '#666'
                            }}
                        >
                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>
                    </div>
                </div>

                {/* Status Messages */}
                {error && <p className="text-danger text-center mb-3" style={{ fontSize: '0.85rem' }}>{error}</p>}
                {message && <p className="text-success text-center mb-3" style={{ fontSize: '0.85rem' }}>{message}</p>}

                {/* Submit Button */}
                {message ? (
                    <button className="login-btn btn w-100 mb-3" onClick={() => navigate('/login')}>
                        Return to Login
                    </button>
                ) : (
                    <button
                        className="login-btn btn w-100 mb-3"
                        onClick={handleResetPassword}
                        disabled={loading}
                    >
                        {loading ? 'Updating...' : 'Set New Password'}
                    </button>
                )}

            </div>
        </div>
    );
}

export default ResetPassword;
