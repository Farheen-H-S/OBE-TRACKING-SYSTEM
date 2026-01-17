import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Welcome.css';
import brain from './brain.png';

const Welcome = () => {
    return (
        <div className="container-fluid welcome-container min-vh-100 d-flex flex-column align-items-center justify-content-center">

            {/* Title Section */}
            <div className="text-center mb-4">
                <h1 className="welcome-title mb-0">Welcome</h1>
            </div>

            {/* Subtitle with lines */}
            <div className="mindease-wrapper mb-5">
                <div className="line"></div>
                <h2 className="mindease-text mb-0">MindEase</h2>
                <div className="line"></div>
            </div>

            {/* Brain Image */}
            <div className="mb-5">
                <img src={brain} alt="Smiling Brain" className="brain-img" />
            </div>

            {/* Footer Text */}
            <div className="fixed-bottom mb-5 d-flex justify-content-center w-100">
                <p className="footer-text mb-0 section-description">
                    Take a quick journey to understand how you’re<br />
                    feeling today !....
                </p>
            </div>
        </div>
    );
};

export default Welcome;
