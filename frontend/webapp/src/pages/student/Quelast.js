import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Quelast.css';
import brain from './brain.png';

const Quelast = () => {
    const [selectedSubjects, setSelectedSubjects] = useState([]);

    const subjects = [
        "Software Engineering",
        "Operating System",
        "Data Analytics",
        "Java Programming",
        "Client Server Scripting"
    ];

    const handleCheckboxChange = (subject) => {
        if (selectedSubjects.includes(subject)) {
            setSelectedSubjects(selectedSubjects.filter(item => item !== subject));
        } else {
            setSelectedSubjects([...selectedSubjects, subject]);
        }
    };

    return (
        <div className="container-fluid quelast-container min-vh-100 d-flex flex-column align-items-center">

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
                    <span className="p-block active"></span>
                    <span className="p-block active"></span>
                </div>
                <span className="progress-text">3 / 3 Completed</span>
            </div>

            {/* Question Section */}
            <div className="question-container w-100 px-3">
                <h3 className="question-label mb-3">Question :</h3>
                <h2 className="question-text mb-4">3. I face difficulties in theses subjects</h2>

                {/* Options List */}
                <div className="options-list">
                    {subjects.map((subject, index) => (
                        <div key={index} className="option-item d-flex align-items-center mb-3" onClick={() => handleCheckboxChange(subject)}>
                            <div className={`custom-checkbox ${selectedSubjects.includes(subject) ? 'checked' : ''}`}>
                                {selectedSubjects.includes(subject) && <span className="checkmark">✔</span>}
                            </div>
                            <span className="option-label">{subject}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Done Button */}
            <div className="mt-5 mb-5">
                <button className="btn btn-primary done-btn">Done</button>
            </div>

        </div>
    );
};

export default Quelast;
