import React, { useState } from 'react';
import Adminhead from '../../components/header/Adminhead';
import Adminside from '../../components/sidebar/Adminside';
import { FaUser } from 'react-icons/fa';
import '../../admin/CreateUser.css';

const CreateUser = () => {
    return (
        <div className="create-user-container d-flex flex-column min-vh-100 overflow-hidden">
            {/* Header - Full Width */}
            <Adminhead />

            {/* Body - Sidebar + Content */}
            <div className="d-flex flex-grow-1 overflow-hidden">
                {/* Sidebar */}
                <Adminside />

                {/* Main Content */}
                <main className="form-content-area p-4 d-flex justify-content-center align-items-start overflow-auto w-100" style={{ backgroundColor: '#f0f2f5' }}>
                    <div className="form-wrapper w-100" style={{ maxWidth: '900px' }}>

                        <div className="form-header d-flex align-items-center mb-4 ps-1">
                            <div className="form-header-icon d-flex justify-content-center align-items-center rounded-circle text-white me-3" style={{ width: '28px', height: '28px', backgroundColor: '#0277bd' }}>
                                <FaUser size={14} />
                            </div>
                            <h2 className="fs-5 fw-bold m-0" style={{ color: '#1a237e' }}>Enter valid credentials to create new user.</h2>
                        </div>

                        <div className="user-form-container card border-0 shadow-sm p-5">

                            <div className="row mb-3 align-items-center">
                                <label className="col-sm-3 col-form-label fw-bold text-secondary">Enter name of user :</label>
                                <div className="col-sm-9">
                                    <input type="text" className="form-control" />
                                </div>
                            </div>

                            <div className="row mb-3 align-items-center">
                                <label className="col-sm-3 col-form-label fw-bold text-secondary">Email id :</label>
                                <div className="col-sm-5">
                                    <input type="text" className="form-control" />
                                </div>
                            </div>

                            <div className="row mb-3 align-items-center">
                                <label className="col-sm-3 col-form-label fw-bold text-secondary">Mobile no. :</label>
                                <div className="col-sm-5">
                                    <div className="input-group">
                                        <span className="input-group-text bg-light text-secondary fw-medium">+ 91</span>
                                        <input type="text" className="form-control" />
                                    </div>
                                </div>
                            </div>

                            <div className="row mb-3 align-items-center">
                                <label className="col-sm-3 col-form-label fw-bold text-secondary">Role :</label>
                                <div className="col-sm-2">
                                    <select className="form-select">
                                        <option value="" hidden selected>Faculty</option>
                                        
                                    <option>HOD</option>
                                    <option>Coordinator</option>
                                    <option>Auditor</option>
                                    </select>
                                </div>
                            </div>

                            <div className="row mb-3 align-items-center">
                                <label className="col-sm-3 col-form-label fw-bold text-secondary">Department :</label>
                                <div className="col-sm-5">
                                    <select className="form-select">
                                        <option>Computer</option>
                                       
                                    <option value="" hidden selected>Information Technology</option>
                                    <option>Mechanical</option>
                                    <option>Civil</option>
                                    <option>Electrical</option>
                                    </select>
                                </div>
                            </div>

                            <div className="row mb-3 align-items-center">
                                <label className="col-sm-3 col-form-label fw-bold text-secondary">From Year :</label>
                                <div className="col-sm-2">
                                    <input type="text" className="form-control" placeholder="2025" />
                                </div>
                            </div>

                            <div className="row mb-3 align-items-center">
                                <label className="col-sm-3 col-form-label fw-bold text-secondary">Date of Joining :</label>
                                <div className="col-sm-3">
                                    <input type="text" className="form-control" placeholder="DD/MM/YYYY" />
                                </div>
                            </div>

                            <div className="row mb-3 align-items-center">
                                <label className="col-sm-3 col-form-label fw-bold text-secondary">Username :</label>
                                <div className="col-sm-3">
                                    <input type="text" className="form-control" />
                                </div>
                            </div>

                            <div className="row mb-3 align-items-center">
                                <label className="col-sm-3 col-form-label fw-bold text-secondary">Password :</label>
                                <div className="col-sm-3">
                                    <input type="password" className="form-control" />
                                </div>
                            </div>

                            <div className="row mb-3 align-items-center">
                                <label className="col-sm-3 col-form-label fw-bold text-secondary">Profile photo</label>
                                <div className="col-sm-9">
                                    <button className="btn btn-light border">Upload</button>
                                </div>
                            </div>

                        </div>

                        <div className="create-btn-container d-flex justify-content-center mt-4">
                            <button className="btn btn-primary px-5 py-2 fw-semibold" style={{ backgroundColor: '#1976d2' }}>Create</button>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
};

export default CreateUser;
