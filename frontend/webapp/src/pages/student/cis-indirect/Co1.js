import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../utils/axios';
import './Co1.css';

const Co1 = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const courseId = searchParams.get('course_id');
    // Enrollment from URL is the freshly-entered value, always reliable.
    // localStorage fallback handles direct navigation edge cases.
    const enrollmentFromUrl = searchParams.get('enrollment');
    const studentNameFromUrl = decodeURIComponent(searchParams.get('studentName') || '');
    const enrollmentNo = enrollmentFromUrl ||
        (() => { try { return JSON.parse(localStorage.getItem('student'))?.enrollment_no; } catch { return null; } })();

    const [cos, setCos] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [answers, setAnswers] = useState({}); // { question_id: value }
    const [loading, setLoading] = useState(true);

    const ratingScale = [
        { val: 4, label: 'Very Good' },
        { val: 3, label: 'Good' },
        { val: 2, label: 'Fair' },
        { val: 1, label: 'Poor' }
    ];

    useEffect(() => {
        if (courseId) {
            fetchCOs();
        }
    }, [courseId]);

    const fetchCOs = async () => {
        try {
            // First fetch survey for this course
            const surveyRes = await api.get('/surveys/', { params: { course_id: courseId, is_active: true } });
            const survey = surveyRes.data.find(s => s.course_id === parseInt(courseId) && s.status === 'APPROVED');

            if (survey && survey.questions && survey.questions.length > 0) {
                setCos(survey.questions.map(q => ({
                    co_id: q.co_id,
                    question_id: q.question_id,
                    description: q.question_text,
                    co_number: q.co_number || (q.co_id ? `CO${q.co_id}` : "Q"),
                    survey_id: survey.survey_id
                })));
            } else if (survey) {
                const coRes = await api.get(`/academics/courses/${courseId}/cos/`);
                setCos(coRes.data.map(co => ({
                    ...co,
                    survey_id: survey.survey_id
                })));
            } else {
                const response = await api.get(`/academics/courses/${courseId}/cos/`);
                setCos(response.data);
            }
        } catch (error) {
            console.error("Error fetching survey details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOptionChange = (option) => {
        const qId = cos[currentIndex]?.question_id;
        setSelectedOption(option);
        setAnswers(prev => ({ ...prev, [qId]: option }));
    };

    const handleNext = async () => {
        if (selectedOption === null) return;

        if (currentIndex < cos.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setSelectedOption(answers[cos[currentIndex + 1]?.co_id] || null);
        } else {
            // Final submission
            try {
                const student = JSON.parse(localStorage.getItem('student'));
                const payload = {
                    survey_id: cos[0]?.survey_id,
                    enrollment_no: enrollmentNo || null,
                    answers: Object.entries(answers).map(([qId, val]) => ({
                        question_id: parseInt(qId),
                        answer_value: val
                    }))
                };

                await api.post('/surveys/respond/', payload);
                navigate('/student/thank-you');
            } catch (err) {
                console.error("Submission failed:", err);
                alert("Failed to submit survey. Please try again.");
            }
        }
    };

    if (loading) {
        return <div className="text-center py-5"><div className="spinner-border text-danger"></div></div>;
    }

    if (cos.length === 0) {
        return (
            <div className="container py-5 text-center">
                <h4 className="text-muted">No questions found for this course.</h4>
                <button className="btn btn-danger mt-3" onClick={() => navigate(-1)}>Go Back</button>
            </div>
        );
    }

    const currentCo = cos[currentIndex];
    const isLast = currentIndex === cos.length - 1;

    // Logic: Are you able to [description]?
    const formatQuestionText = (desc) => {
        if (!desc) return "";
        let cleanDesc = desc.trim();
        if (cleanDesc.endsWith('.')) cleanDesc = cleanDesc.slice(0, -1);
        return `Are you able to ${cleanDesc.charAt(0).toLowerCase() + cleanDesc.slice(1)}?`;
    };

    return (
        <div className="container-fluid co1-container d-flex flex-column align-items-center justify-content-start pt-5">
            <div className="co1-content w-100" style={{ maxWidth: '600px' }}>
                <div className="text-center mb-1">
                    {studentNameFromUrl && (
                        <p className="text-muted small mb-0 fw-bold">Responding as: <span className="text-danger">{studentNameFromUrl}</span></p>
                    )}
                </div>
                <h2 className="text-center co1-title mb-5">{currentCo.co_number.includes('.') ? currentCo.co_number : `CO${currentCo.co_number.replace(/[^0-9]/g, '')}`}</h2>

                <p className="co1-question mb-4 fw-semibold text-dark fs-5">
                    {formatQuestionText(currentCo.description)}
                </p>

                <div className="co1-options mb-5 ps-1">
                    {ratingScale.map((item) => (
                        <label key={item.val} className="form-check mb-4 p-3 border rounded-3 radio-option-pill d-flex align-items-center cursor-pointer" htmlFor={`option-${item.val}`}>
                            <input
                                className="form-check-input co1-radio-input ms-0 mt-0"
                                type="radio"
                                name="survey-options"
                                id={`option-${item.val}`}
                                checked={selectedOption === item.val}
                                onChange={() => handleOptionChange(item.val)}
                            />
                            <div className="ms-3 co1-option-text d-flex align-items-center">
                                <span className="fw-bold me-2 fs-5">{item.val}</span>
                                <span className="text-muted small">({item.label})</span>
                            </div>
                        </label>
                    ))}
                </div>

                <div className="d-flex justify-content-center">
                    <button
                        className={`btn btn-danger btn-lg px-5 fw-bold co1-btn ${selectedOption === null ? 'opacity-50' : ''}`}
                        onClick={handleNext}
                        disabled={selectedOption === null}
                    >
                        {isLast ? 'SUBMIT' : 'NEXT'}
                    </button>
                </div>

                <p className="text-center text-muted mt-4 small">
                    Question {currentIndex + 1} of {cos.length}
                </p>
            </div>
        </div>
    );
};

export default Co1;
