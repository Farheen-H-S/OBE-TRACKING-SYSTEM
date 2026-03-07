import React, { useState } from 'react';
import '../../stress/question/Question.css';
import { brain } from '../../../../assets/images';

const Question = ({ questions, onSubmit, title = "Feedback Hub" }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [error, setError] = useState('');

    if (!questions.length) return (
        <div className="quea-container d-flex align-items-center justify-content-center">
            <div className="text-center">
                <p className="fs-5 text-muted">Loading questions...</p>
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        </div>
    );

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
            <div className="logo-wrapper">
                <img src={brain} alt="Logo" className="brain-logo" />
                <div className="mindease-logo-text">{title}</div>
            </div>

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

            <div className="question-container">
                <div className="question-label">Statement</div>
                <div className="question-text">{currentIndex + 1}. {current.text}</div>

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

            <div className="question-action-wrapper">
                <div className="error-placeholder">{error}</div>
                <div className="question-action">
                    <button className="next-btn" onClick={handleNext}>
                        {currentIndex === questions.length - 1 ? 'Submit Feedback' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Question;
