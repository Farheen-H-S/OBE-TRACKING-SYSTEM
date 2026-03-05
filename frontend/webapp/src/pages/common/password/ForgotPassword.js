import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../../api';
import '../login/Login.css'; // Reusable styles from Login.css
import { logo } from '../../../assets/images';

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleForgotPassword = async () => {
        if (!email) {
            setError("Please enter your email address.");
            return;
        }

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const response = await api.post('/users/auth/forgot-password/', { email });
            setMessage(response.data.message || "Reset link sent.");
        } catch (err) {
            console.error(err);
            // Fallback message so we don't leak user existence
            setMessage("If an account with this email exists, a reset link has been sent");
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

                <h4 className="login-title text-center mb-4">Forgot Password</h4>
                <p className="text-center text-muted mb-4" style={{ fontSize: '0.9rem' }}>
                    Enter your registered email address and we will send you a link to reset your password.
                </p>

                {/* Email */}
                <div className="mb-4">
                    <input
                        type="email"
                        placeholder="Email Address"
                        className="form-control input-box"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleForgotPassword(); }}
                        disabled={loading}
                    />
                </div>

                {/* Status Messages */}
                {error && <p className="text-danger text-center mb-3" style={{ fontSize: '0.85rem' }}>{error}</p>}
                {message && <p className="text-success text-center mb-3" style={{ fontSize: '0.85rem' }}>{message}</p>}

                {/* Submit Button */}
                <button
                    className="login-btn btn w-100 mb-3"
                    onClick={handleForgotPassword}
                    disabled={loading}
                >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </button>

                {/* Back to Login */}
                <p className="text-center mt-2 mb-0" style={{ fontSize: '0.9rem' }}>
                    <Link to="/login" style={{ textDecoration: 'none', color: '#0d6efd' }}>Return to Login</Link>
                </p>

            </div>
        </div>
    );
}

export default ForgotPassword;
