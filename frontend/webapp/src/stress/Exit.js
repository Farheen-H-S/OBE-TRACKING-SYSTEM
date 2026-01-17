import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Exit.css';
import brain from './brain.png';

const Exit = () => {
    return (
        <div className="container-fluid exit-container min-vh-100 d-flex flex-column align-items-center">

            {/* Header / Logo Section */}
            <div className="text-center mt-4 mb-3">
                <div className="logo-wrapper">
                    <img src={brain} alt="Brain Mascot" className="brain-logo" />
                    <span className="mindease-logo-text">MindEase</span>
                </div>
            </div>

            {/* Mission Completed Title */}
            <div className="text-center mb-5 title-section">
                <h6 className="mission-title mb-2">Stress Check mission :</h6>
                <h6 className="mission-completed">Completed !!</h6>
            </div>

            {/* Emoji Section */}
            <div className="text-center mb-5">
                <div className="emoji-medium">😌</div>
                <h2 className="mood-text">Relaxed</h2>
            </div>

            {/* Score Section */}
            <div className="text-center mb-5 score-section">
                <h3 className="score-text">Overall score : 10 / 15</h3>
                <h3 className="category-text">Category : Mild Stress</h3>
            </div>

            {/* Exit Button */}
            <div className="mb-5">
                <button className="btn btn-primary exit-btn">Exit</button>
            </div>

        </div>
    );
};

export default Exit;
