import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../utils/axios';
import './Cwelcome.css';
const redbg = '/images/redbg.jpg';

const Cwelcome = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const courseId = searchParams.get('course_id');
    const enrollment = searchParams.get('enrollment') || '';
    const studentName = decodeURIComponent(searchParams.get('studentName') || '');
    const [course, setCourse] = useState(null);
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            // Strict Identity Enforcement: If enrollment is missing, force redirect to login
            if (!enrollment) {
                navigate(`/student/cis-login?course_id=${courseId}`);
                return;
            }
            await fetchSchemes();
            if (courseId) {
                fetchCourseDetails();
            }
        };
        init();
    }, [courseId, enrollment]);

    const fetchSchemes = async () => {
        try {
            const response = await api.get('/academics/schemes/');
            setSchemes(response.data);
        } catch (error) {
            console.error("Error fetching schemes:", error);
        }
    };

    const fetchCourseDetails = async () => {
        try {
            const response = await api.get(`/academics/courses/${courseId}/`);
            setCourse(response.data);
        } catch (error) {
            console.error("Error fetching course for welcome page:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-5"><div className="spinner-border text-danger"></div></div>;
    }

    const schemeName = schemes.find(s => String(s.scheme_id) === String(course?.scheme_id))?.scheme_name || 'N/A';

    return (
        <div className="container-fluid p-0 cwelcome-container">
            <div className="cwelcome-header-section d-flex align-items-center mb-0 position-relative">
                <img src={redbg} alt="Background" className="cwelcome-bg-img" />
                <button
                    className="btn btn-light rounded-circle shadow-sm ms-3 me-2"
                    style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}
                    onClick={() => navigate(-1)}
                    title="Go Back"
                >
                    <i className="bi bi-arrow-left fs-5"></i>
                </button>
                <div style={{ zIndex: 1 }}>
                        <h2 className="cwelcome-title mb-0">Welcome to Course Exit Survey (CES)</h2>
                </div>
            </div>

            <div className="container py-3">
                <div className="row justify-content-center">
                    <div className="col-lg-10">
                        {/* Course Info Card */}
                        <div className="card shadow-sm border-0 rounded-4 overflow-hidden cwelcome-info-card mb-4">
                            <div className="card-body p-4">
                                <div className="row align-items-center">
                                    <div className="col-md-7 border-end pe-md-4">
                                        <div className="mb-4">
                                            <p className="text-danger small fw-bold mb-1 letter-spacing-1">PROGRAM: {course?.program_name || 'N/A'}</p>
                                            <h3 className="fw-bold mb-0 text-dark">Course Exit Survey</h3>
                                            <p className="text-muted mb-0">Academic Year: 2025-26</p>
                                        </div>

                                        <table className="table table-bordered cwelcome-table mb-0">
                                            <tbody>
                                                <tr>
                                                    <td className="secondary-text fw-bold">Course Title</td>
                                                    <td className="fw-bold text-dark">{course?.course_title || 'N/A'}</td>
                                                </tr>
                                                <tr>
                                                    <td className="secondary-text fw-bold">Course Name</td>
                                                    <td className="fw-bold text-dark">{course?.course_name || 'N/A'}</td>
                                                </tr>
                                                <tr>
                                                    <td className="secondary-text fw-bold">Faculty Name</td>
                                                    <td className="fw-bold text-dark">{course?.faculty_assigned_name || 'Prof. Not Assigned'}</td>
                                                </tr>
                                                <tr>
                                                    <td className="secondary-text fw-bold">Scheme / Class</td>
                                                    <td className="fw-bold text-dark">{schemeName} / {course?.class_year || 'N/A'}</td>
                                                </tr>
                                                <tr>
                                                    <td className="secondary-text fw-bold">Student Name</td>
                                                    <td className="fw-bold text-danger">{studentName || 'N/A'}</td>
                                                </tr>
                                                <tr>
                                                    <td className="secondary-text fw-bold">Enrollment No</td>
                                                    <td className="fw-bold text-danger">{enrollment || 'N/A'}</td>
                                                </tr>
                                                <tr>
                                                    <td className="secondary-text fw-bold">Semester</td>
                                                    <td className="fw-bold text-dark">Sem {course?.semester || 'N/A'}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="col-md-5 ps-md-4 d-flex flex-column justify-content-between">
                                        <div>
                                            <p className="cwelcome-instruction small mb-3">
                                                <span className="text-danger fw-bold">Instruction: </span>
                                                Read each CO statement carefully and rate based on your achievement.
                                            </p>

                                            <p className="fw-bold mb-2 small uppercase letter-spacing-1">Rating Scale:</p>
                                            <div className="rating-scale-grid mb-3">
                                                <div className="rating-pill d-flex align-items-center mb-1">
                                                    <span className="badge bg-danger me-2">4</span> <span className="small">Very Good</span>
                                                </div>
                                                <div className="rating-pill d-flex align-items-center mb-1">
                                                    <span className="badge bg-danger me-2">3</span> <span className="small">Good</span>
                                                </div>
                                                <div className="rating-pill d-flex align-items-center mb-1">
                                                    <span className="badge bg-danger me-2">2</span> <span className="small">Fair</span>
                                                </div>
                                                <div className="rating-pill d-flex align-items-center">
                                                    <span className="badge bg-danger me-2">1</span> <span className="small">Poor</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-end pt-3 mt-auto">
                                            {studentName && (
                                                <div className="mb-2 text-muted small">
                                                    Responding as: <span className="fw-bold text-danger">{studentName}</span>
                                                </div>
                                            )}
                                            <button
                                                className="btn btn-danger btn-lg px-5 fw-bold cwelcome-btn"
                                                onClick={() => navigate(`/student/co1?course_id=${courseId}&enrollment=${encodeURIComponent(enrollment)}&studentName=${encodeURIComponent(studentName)}`)}
                                            >
                                                START
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cwelcome;
