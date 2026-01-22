import React from 'react';
import './Clogin.css';
import llogo from '../llogo.jpg';

const Clogin = () => {
    return (
        <div className="container-fluid d-flex flex-column align-items-center justify-content-start pt-5 clogin-container">
            <div className="text-center mb-4 mt-5">
                <img src={llogo} alt="Sandip Foundation" className="img-fluid mb-3 clogin-logo" />
                <h3 className="clogin-header-text">Login to start your session</h3>
            </div>

            <div className="card clogin-card shadow-sm">
                <div className="card-body p-4">
                    <h5 className="text-center mb-3 clogin-label">Enrollment number</h5>
                    <input type="text" className="form-control mb-4 clogin-input" />
                    <div className="d-flex justify-content-end">
                        <button className="btn btn-danger btn-sm px-3 clogin-btn">Login</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Clogin;
