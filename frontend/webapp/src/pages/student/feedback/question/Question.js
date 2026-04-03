import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import './Question.css';
const brain = '/images/brain.png';

const Question = ({ questions, onSubmit, title = "Teacher Feedback" }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [hover, setHover] = useState(0);
    const [error, setError] = useState('');

    if (!questions.length) return (
        <div className="quea-container d-flex align-items-center justify-content-center">
            <div className="text-center">
                <p className="fs-5 text-muted">Loading teachers...</p>
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        </div>
    );

    const current = questions[currentIndex];

    const handleSelect = (teacherId, value) => {
        setAnswers({ ...answers, [teacherId]: value });
        setError('');
    };

    const handleNext = () => {
        // Validate that all teachers on the current page have a rating
        if (current.teachers) {
            const unanswered = current.teachers.find(t => answers[t.id] === undefined);
            if (unanswered) {
                setError(`Please provide a rating for ${unanswered.teacherName}`);
                return;
            }
        } else {
            if (answers[current.id] === undefined) {
                setError('Please provide a rating');
                return;
            }
        }

        if (currentIndex === questions.length - 1) {
            onSubmit(answers);
        } else {
            setCurrentIndex(currentIndex + 1);
            setHover(0); // Reset hover for next question
        }
    };

    const renderStars = (id, currentVal) => {
        return (
            <div className="star-rating-wrapper d-flex justify-content-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => {
                    const ratingValue = star;
                    const isSelected = ratingValue <= (currentVal || 0);
                    // Use a local state for hover per teacher or simplified:
                    // For now, let's just make it simple clicks as hover per row is complex in a list
                    // or use a temporary local index for hover.

                    return (
                        <label key={star} className="star-label m-0">
                            <input
                                type="radio"
                                name={`rating-${id}`}
                                className="d-none"
                                value={ratingValue}
                                onClick={() => handleSelect(id, ratingValue)}
                            />
                            <FaStar
                                className="star-icon"
                                size={32}
                                color={isSelected ? "#ffc107" : "#e4e5e9"}
                                style={{ cursor: 'pointer', transition: 'all 200ms ease' }}
                                onMouseEnter={() => setHover(ratingValue)}
                                onMouseLeave={() => setHover(0)}
                            />
                        </label>
                    );
                })}
            </div>
        );
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

            <div className="question-container text-center py-4">
                <div className="question-text fs-4 fw-bold mb-4 px-3" style={{ color: '#2d3436', lineHeight: '1.4' }}>
                    {current.text}
                </div>

                {current.teachers ? (
                    <div className="teachers-matrix-list px-3">
                        {current.teachers.map((teacher) => (
                            <div key={teacher.id} className="teacher-rating-row d-flex align-items-center justify-content-between p-3 mb-2 rounded shadow-sm bg-white">
                                <span className="teacher-name fw-semibold flex-grow-1 text-start">{teacher.teacherName}</span>
                                <div className="d-flex align-items-center gap-3">
                                    {renderStars(teacher.id, answers[teacher.id])}
                                    <span className="rating-value text-primary fw-bold" style={{ minWidth: '45px', fontSize: '1.1rem' }}>
                                        {answers[teacher.id] ? `${answers[teacher.id]}` : '-'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="single-rating-box">
                        <div className="question-label text-uppercase mb-3" style={{ letterSpacing: '2px', color: '#6c757d', fontSize: '0.8rem' }}>
                            Rate this Statement
                        </div>
                        <div className="d-flex justify-content-center gap-2 mb-4">
                            {renderStars(current.id, answers[current.id])}
                        </div>
                        {answers[current.id] && (
                            <div className="rating-label fw-bold text-warning fs-5">
                                {answers[current.id]} / 5 Stars
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="question-action-wrapper mt-auto">
                <div className="error-placeholder text-danger small mb-2" style={{ height: '20px' }}>{error}</div>
                <div className="question-action">
                    <button className="next-btn" onClick={handleNext}>
                        {currentIndex === questions.length - 1 ? 'Submit Feedback' : 'Next Question'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Question;
