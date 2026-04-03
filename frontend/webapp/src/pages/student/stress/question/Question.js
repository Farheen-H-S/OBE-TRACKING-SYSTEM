import React, { useState } from 'react';
import './Question.css';
const brain = '/images/brain.png';

const Question = ({ questions, onSubmit }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [error, setError] = useState('');

    if (!questions.length) return <p>Loading questions...</p>;

    const current = questions[currentIndex];

    const handleSelect = (value) => {
        setAnswers({ ...answers, [current.id]: value });
        setError('');
    };

    const handleNext = () => {
        if (answers[current.id] === undefined) {
            setError('Please select an option');
            return;
        }
        if (currentIndex === questions.length - 1) {
            onSubmit(answers);
        } else {
            setCurrentIndex(currentIndex + 1);
        }
    };

    return (
        <div className="quea-container">
            {/* Logo section */}
            <div className="logo-wrapper">
                <img src={brain} alt="Brain" className="brain-logo" />
                <div className="mindease-logo-text">MindEase</div>
            </div>

            {/* Progress section */}
            <div className="progress-section">
                <div className="progress-blocks">
                    {questions.map((_, idx) => (
                        <div
                            key={idx}
                            className={`p-block ${idx <= currentIndex ? 'active' : ''}`}
                        />
                    ))}
                </div>
                <div className="progress-text">
                    Question {currentIndex + 1} of {questions.length}
                </div>
            </div>

            {/* Question */}
            <div className="question-container">
                <div className="question-label">Question</div>
                <div className="question-text">{currentIndex + 1}. {current.text}</div>

                {/* Options */}
                <div className="options-list">
                    {current.options.map(opt => (
                        <div
                            key={opt.id}
                            className="option-item"
                            onClick={() => handleSelect(opt.value)}
                        >
                            <span
                                className={`custom-radio ${answers[current.id] === opt.value ? 'checked' : ''
                                    }`}
                            />
                            <span className="emoji">{opt.emoji}</span>
                            <span className="option-label">{opt.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action buttons */}
            <div className="question-action-wrapper">
                <div className="error-placeholder">{error}</div>
                <div className="question-action">
                    <button className="next-btn" onClick={handleNext}>
                        {currentIndex === questions.length - 1 ? 'Submit' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Question;
