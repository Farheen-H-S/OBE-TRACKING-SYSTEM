import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Clogin.css';
import { sflogo2 } from '../../../assets/images';

import api from '../../../utils/axios';
import { FaBook, FaUserGraduate, FaArrowRight } from 'react-icons/fa';

const Clogin = () => {
    const [enrollment, setEnrollment] = useState('');
    const [error, setError] = useState('');
    const [courseDetails, setCourseDetails] = useState(null);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const surveyType = searchParams.get('survey');
    const courseId = searchParams.get('course_id');

    useEffect(() => {
        if (courseId) {
            fetchCourseDetails();
        }
    }, [courseId]);

    const fetchCourseDetails = async () => {
        try {
            const response = await api.get(`/academics/courses/${courseId}/`);
            const course = response.data;
            if (course.co_status?.toLowerCase() !== 'completed') {
                setError("This survey is not yet available as the course outcomes mapping is incomplete.");
                setCourseDetails(null);
            } else {
                setCourseDetails(course);
            }
        } catch (err) {
            console.error("Error fetching course for survey:", err);
            setError("Unable to load course details. Please try again later.");
        }
    };

    const handleLogin = async () => {
        if (!enrollment.trim()) {
            setError('Please enter your enrollment number.');
            return;
        }
        try {
            const response = await api.get('/users/students/', { params: { enrollment_no: enrollment.trim() } });
            const data = response.data;
            const student = Array.isArray(data) ? data[0] : data;
            if (student && student.enrollment_no) {
                // Check if already responded to this course's survey
                if (courseId) {
                    try {
                        const eligibility = await api.get('/surveys/check-participation/', { 
                            params: { enrollment_no: student.enrollment_no, course_id: courseId } 
                        });
                        if (eligibility.data.responded) {
                            setError('You have already responded to this survey.');
                            return;
                        }
                    } catch (e) {
                         console.error("Eligibility check failed:", e);
                    }
                }
                setError('');
                localStorage.setItem('student', JSON.stringify(student));
                if (surveyType === 'expert-talk') {
                    navigate('/student/expert-talk-welcome');
                } else if (courseId) {
                    navigate(`/student/cis-welcome?course_id=${courseId}&enrollment=${encodeURIComponent(student.enrollment_no)}&studentName=${encodeURIComponent(student.name || student.full_name || '')}`);
                } else {
                    navigate(`/student/cis-welcome?enrollment=${encodeURIComponent(student.enrollment_no)}&studentName=${encodeURIComponent(student.name || student.full_name || '')}`);
                }
            } else {
                setError('Invalid enrollment number. Please try again.');
            }
        } catch (err) {
            console.error('Error validating enrollment:', err);
            setError('Invalid enrollment number. Please try again.');
        }
    };

    return (
        <div className="container-fluid d-flex flex-column align-items-center justify-content-center clogin-container">
            <div className="text-center mb-4">
                <img src={sflogo2} alt="Sandip Foundation" className="clogin-logo mb-2" />
                <h3 className="clogin-header-text">Course Exit Survey</h3>
            </div>

            <div className="card clogin-card p-4">
                {courseDetails && (
                    <div className="course-context-info mb-3 text-center">
                        <h5 className="fw-bold" style={{ color: '#ff3333' }}>{courseDetails.course_name}</h5>
                        <p className="mb-0 small text-muted">Course Code: <strong>{courseDetails.course_code}</strong></p>
                        <hr />
                    </div>
                )}

                <h5 className="text-center mb-4 clogin-label">Student Login</h5>

                <div className="mb-3">
                    <label className="form-label small fw-bold">Enrollment Number</label>
                    <input
                        type="text"
                        className={`form-control clogin-input ${error ? 'is-invalid' : ''}`}
                        value={enrollment}
                        onChange={(e) => setEnrollment(e.target.value)}
                        placeholder="Enrollment No."
                    />
                    {error && <div className="text-danger small mt-1">{error}</div>}
                </div>

                <button
                    className="btn btn-primary w-100 py-2 fw-bold clogin-btn"
                    onClick={handleLogin}
                >
                    PROCEED <FaArrowRight fontSize="small" className="ms-2" />
                </button>

                <p className="text-center mt-4 mb-0 small text-muted italic">
                    Enter enrollment number as per college records
                </p>
            </div>

            <footer className="mt-4 text-muted small">
                © {new Date().getFullYear()} Sandip Foundation - OBE System
            </footer>
        </div>
    );
};

export default Clogin;
