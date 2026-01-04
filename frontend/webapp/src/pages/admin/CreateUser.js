import React, { useState } from 'react';
import Header from '../../components/header/Header';
import { FaCircle, FaMinus, FaUser } from 'react-icons/fa';
import './CreateUser.css';

const CreateUser = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(true);

    return (
        <div className="create-user-container">
            <Header />

            <div className="create-user-body">
                {/* Sidebar (Included directly as per request) */}
                <aside className="admin-sidebar">
                    <div className="user-profile-banner">
                        <div className="user-profile-img">
                            <FaUser />
                        </div>
                        <div className="user-profile-info">
                            <h3>Welcome Mitesh!</h3>
                            <p>312023016</p>
                        </div>
                    </div>

                    <div className="role-bar">
                        User : Admin
                    </div>

                    <ul className="sidebar-nav">
                        <li className="nav-item" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            <FaCircle className="nav-dot" />
                            <span style={{ flex: 1 }}>User management</span>
                            <FaMinus style={{ fontSize: '0.7rem' }} />
                        </li>
                        {isMenuOpen && (
                            <div className="sub-nav">
                                <div className="sub-nav-item" style={{ fontWeight: 'bold' }}>Create User</div>
                                <div className="sub-nav-item">View user</div>
                            </div>
                        )}

                        <li className="nav-item">
                            <FaCircle className="nav-dot" /> Current setup
                        </li>
                        <li className="nav-item">
                            <FaCircle className="nav-dot" /> Audit log
                        </li>
                    </ul>
                </aside>

                {/* Main Form Content */}
                <main className="form-content-area">
                    <div className="form-wrapper">

                        <div className="form-header">
                            <div className="form-header-icon"><FaUser /></div>
                            <h2>Enter valid credentials to create new user.</h2>
                        </div>

                        <div className="user-form-container">

                            <div className="form-group-vertical">
                                <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>Enter name of user</label>
                                <input type="text" className="input-field" />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email id :</label>
                                <div className="form-controls">
                                    <input type="text" className="input-underline" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Mobile no. :</label>
                                <div className="form-controls mobile-group">
                                    <span className="mobile-prefix">+ 91</span>
                                    <input type="text" className="mobile-input" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Role :</label>
                                <div className="form-controls">
                                    <select className="select-field">
                                        <option>Faculty</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Department :</label>
                                <div className="form-controls">
                                    <select className="select-field">
                                        <option>Computer</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">From Year :</label>
                                <div className="form-controls">
                                    <input type="text" className="date-join-input" placeholder="2025" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Date of Joining :</label>
                                <div className="form-controls">
                                    <input type="text" className="date-join-input" placeholder="DD/MM/YYYY" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Username :</label>
                                <div className="form-controls">
                                    <input type="text" className="input-field" style={{ maxWidth: '300px' }} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Password :</label>
                                <div className="form-controls">
                                    <input type="password" className="input-field" style={{ maxWidth: '300px' }} />
                                </div>
                            </div>

                            <div className="form-group" style={{ alignItems: 'flex-start' }}>
                                <label className="form-label" style={{ marginTop: '5px' }}>Profile photo</label>
                                <div className="form-controls">
                                    <button className="upload-btn">Upload</button>
                                </div>
                            </div>

                        </div>

                        <div className="create-btn-container">
                            <button className="create-btn">Create</button>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
};

export default CreateUser;
