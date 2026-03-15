import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './OITLogin.css';
import { sflogo2 } from '../../../assets/images';
import api from '../../../utils/axios';
import { FaArrowRight } from 'react-icons/fa';

const TOOL_LABELS = {
    'co-curricular': 'Co-curricular / Extra Curricular Activity Feedback',
    'resource-person': 'Resource Person Feedback',
    'program-exit': 'Program Exit Survey',
    'alumni': 'Alumni Feedback',
};

const OITLogin = () => {
    const [inputVal, setInputVal] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const survey = searchParams.get('survey') || '';
    const programId = searchParams.get('program') || '';
    const classYear = searchParams.get('class') || '';
    const division = searchParams.get('div') || '';
    const year = searchParams.get('year') || '';
    const activityType = searchParams.get('activity_type') || '';
    const activityTitle = searchParams.get('activity_title') || '';

    const type = searchParams.get('type') || '';
    const isRP = type === 'resource-person';
    const isAlumni = type === 'alumni';
    const toolLabel = TOOL_LABELS[type] || 'Indirect Survey';

    const buildWelcomeParams = (name = '') => {
        const params = new URLSearchParams({ survey, type, program: programId, class: classYear, div: division, year });
        if (activityType) params.set('activity_type', activityType);
        if (activityTitle) params.set('activity_title', activityTitle);
        if (name) params.set('respondentName', name);
        return params.toString();
    };

    const handleLogin = async () => {
        if (!inputVal.trim()) {
            setError(isRP ? 'Please enter your name.' : 'Please enter your enrollment number.');
            return;
        }

        if (isRP) {
            // Resource Person — store name, no validation needed
                localStorage.setItem('oit_respondent', JSON.stringify({
                    type: 'resource-person',
                    name: inputVal.trim(),
                    respondentName: inputVal.trim(),
                }));
                navigate(`/student/oit-welcome?${buildWelcomeParams(inputVal.trim())}`);
        } else {
            // Student / Alumni — validate against backend
            try {
                const response = await api.get('/users/students/', { params: { enrollment_no: inputVal.trim() } });
                const data = response.data;
                const student = Array.isArray(data) ? data[0] : data;
                if (student && student.enrollment_no) {
                    setError('');
                    localStorage.setItem('oit_respondent', JSON.stringify({
                        type: 'student',
                        enrollment: student.enrollment_no,       // legacy key kept for compatibility
                        enrollment_no: student.enrollment_no,    // canonical key
                        rollNo: student.roll_no,
                        respondentName: student.full_name || student.name,
                        ...student,
                    }));
                    navigate(`/student/oit-welcome?${buildWelcomeParams(student.full_name || student.name)}`);
                } else {
                    setError('Invalid enrollment number. Please try again.');
                }
            } catch (err) {
                console.error('Error validating enrollment:', err);
                setError('Invalid enrollment number. Please try again.');
            }
        }
    };

    return (
        <div className="container-fluid d-flex flex-column align-items-center justify-content-center oitlogin-container">
            <div className="text-center mb-4">
                <img src={sflogo2} alt="Sandip Foundation" className="oitlogin-logo mb-2" />
                <h3 className="oitlogin-header-text">{toolLabel}</h3>
                {(classYear || division) && (
                    <p className="text-muted small mb-0">{classYear} – Division {division} &nbsp;|&nbsp; {year}</p>
                )}
            </div>

            <div className="card oitlogin-card p-4">
                <h5 className="text-center mb-4 oitlogin-label">
                    {isRP ? 'Resource Person Details' : isAlumni ? 'Alumni Login' : 'Student Login'}
                </h5>

                <div className="mb-3">
                    <label className="form-label small fw-bold">
                        {isRP ? 'Your Full Name' : 'Enrollment Number'}
                    </label>
                    <input
                        type="text"
                        className={`form-control oitlogin-input ${error ? 'is-invalid' : ''}`}
                        value={inputVal}
                        onChange={e => { setInputVal(e.target.value); setError(''); }}
                        placeholder={isRP ? 'e.g. Dr. John Smith' : 'Enrollment No.'}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    />
                    {error && <div className="text-danger small mt-1">{error}</div>}
                </div>

                <button
                    className="btn btn-primary w-100 py-2 fw-bold oitlogin-btn"
                    onClick={handleLogin}
                >
                    PROCEED <FaArrowRight fontSize="small" className="ms-2" />
                </button>

                <p className="text-center mt-4 mb-0 small text-muted">
                    {isRP
                        ? 'Enter your name as you would like it to appear in the report'
                        : 'Enter enrollment number as per college records'}
                </p>
            </div>

            <footer className="mt-4 text-muted small">
                © {new Date().getFullYear()} Sandip Foundation – OBE System
            </footer>
        </div>
    );
};

export default OITLogin;
