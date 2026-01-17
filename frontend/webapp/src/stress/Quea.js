import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Quea.css';
import brain from './brain.png';

const Quea = () => {
    const [selectedOption, setSelectedOption] = useState(null);

    const handleOptionChange = (option) => {
        setSelectedOption(option);
    };

    return (
        <div className="container-fluid quea-container min-vh-100 d-flex flex-column align-items-center">

            {/* Header / Logo Section */}
            <div className="text-center mt-4 mb-3">
                <div className="logo-wrapper">
                    <img src={brain} alt="Brain Mascot" className="brain-logo" />
                    <span className="mindease-logo-text">MindEase</span>
                </div>
            </div>

            {/* Progress Indicator */}
            <div className="progress-section mb-5">
                <div className="progress-blocks">
                    <span className="p-block active"></span>
                    <span className="p-block"></span>
                    <span className="p-block"></span>
                </div>
                <span className="progress-text">1 / 3 Completed</span>
            </div>

            {/* Question Section */}
            <div className="question-container w-100 px-3">
                <h3 className="question-label mb-3">Question :</h3>
                <h2 className="question-text mb-4">1. Are assignments too much?</h2>

                {/* Options */}
                <div className="options-list">
                    {[
                        { label: 'Never', emoji: '😊' },
                        { label: 'Rarely', emoji: '😐' },
                        { label: 'Sometimes', emoji: '😞' },
                        { label: 'Often', emoji: '😰' },
                        { label: 'Always', emoji: '😭' }
                    ].map((option, index) => (
                        <div key={index} className="option-item d-flex align-items-center mb-3" onClick={() => handleOptionChange(option.label)}>
                            <div className={`custom-radio ${selectedOption === option.label ? 'selected' : ''}`}></div>
                            <span className="emoji me-2">{option.emoji}</span>
                            <span className="option-label">– {option.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Next Button */}
            <div className="mt-5 mb-5">
                <button className="btn btn-primary next-btn">Next</button>
            </div>

        </div>
    );
};

export default Quea;
