import React, { useState, useEffect } from 'react';
import './Cescreate.css';
import api from '../../../utils/axios';
import { FaCopy, FaCheckCircle, FaExclamationCircle, FaSearch, FaFilter, FaEdit, FaCheck } from 'react-icons/fa';
import { getDefaultSemester, getCachedSemesterType } from '../../../utils/semesterUtils';

const Cescreate = () => {
    // Academic state
    const [programs, setPrograms] = useState([]);
    const [schemes, setSchemes] = useState([]);
    const [academicYear, setAcademicYear] = useState('');
    const [courses, setCourses] = useState([]);
    const [coursesLoading, setCoursesLoading] = useState(false);

    // Filter state
    const [selectedProgram, setSelectedProgram] = useState('');
    const [selectedScheme, setSelectedScheme] = useState('');
    const [selectedYear, setSelectedYear] = useState('2025 - 26');
    const [selectedClass, setSelectedClass] = useState('FY');
    const [selectedDivision, setSelectedDivision] = useState('A');
    const [selectedSemester, setSelectedSemester] = useState(() => getDefaultSemester('FY', getCachedSemesterType()));
    const [searchTerm, setSearchTerm] = useState('');

    // Survey states
    const [surveyStates, setSurveyStates] = useState({}); // { courseId: { status, duration, link } }
    const [courseCos, setCourseCos] = useState({}); // { courseId: [cos] }

    // Link box state
    const [activeSurvey, setActiveSurvey] = useState(null);
    const [timeLeft, setTimeLeft] = useState("");

    // Stats state
    const [showStats, setShowStats] = useState({}); // { courseId: boolean }
    const [surveyResponses, setSurveyResponses] = useState({}); // { courseId: [responses] }

    useEffect(() => {
        fetchInitialData();
    }, []);

    // Auto-update semester when class changes
    useEffect(() => {
        const semType = getCachedSemesterType();
        setSelectedSemester(getDefaultSemester(selectedClass, semType));
    }, [selectedClass]);

    useEffect(() => {
        const timer = setInterval(updateCountdown, 1000);
        return () => clearInterval(timer);
    }, [activeSurvey]);

    const updateCountdown = () => {
        if (!activeSurvey?.expires_at) {
            setTimeLeft("");
            return;
        }
        const now = new Date();
        const expiry = new Date(activeSurvey.expires_at);
        const diff = expiry - now;

        if (diff <= 0) {
            setTimeLeft("Link Expired");
            return;
        }

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);

        setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
    };

    const fetchInitialData = async () => {
        try {
            const userStr = localStorage.getItem('user');
            let user = null;
            try {
                user = userStr ? JSON.parse(userStr) : null;
            } catch (e) {
                console.error("Invalid user data in localStorage");
            }

            const userDept = user?.department || user?.department_id;

            // Use relative paths without leading slash to ensure alignment with baseURL
            const [progRes, schemeRes, setupRes, surveyRes] = await Promise.allSettled([
                api.get('academics/programs/'),
                api.get('academics/schemes/list/'),
                api.get('academics/academic-setup/'),
                api.get('surveys/')
            ]);

            if (progRes.status === 'fulfilled') {
                const data = Array.isArray(progRes.value.data) ? progRes.value.data : [];
                const filteredProgs = data.filter(p => p.program_name && !p.program_name.toLowerCase().includes('test'));
                setPrograms(filteredProgs);
                if (userDept) setSelectedProgram(userDept.toString());
                else if (filteredProgs.length > 0) setSelectedProgram(filteredProgs[0].program_id.toString());
            }

            if (schemeRes.status === 'fulfilled') {
                const data = Array.isArray(schemeRes.value.data) ? schemeRes.value.data : [];
                const filteredSchemes = data.filter(s => s.scheme_name && !s.scheme_name.toLowerCase().includes('test'));
                setSchemes(filteredSchemes);
                if (filteredSchemes.length > 0) setSelectedScheme(filteredSchemes[0].scheme_id.toString());
            }

            if (setupRes.status === 'fulfilled' && setupRes.value.data) {
                const setup = setupRes.value.data;
                if (setup.academic_year) {
                    setAcademicYear(setup.academic_year);
                    // Match the dropdown format if possible
                    const yearVal = setup.academic_year.includes('-') && !setup.academic_year.includes(' - ')
                        ? setup.academic_year.replace('-', ' - ')
                        : setup.academic_year;
                    setSelectedYear(yearVal);
                }
                if (setup.scheme_id) setSelectedScheme(setup.scheme_id.toString());
            }

            if (surveyRes.status === 'fulfilled') {
                const surveyData = Array.isArray(surveyRes.value.data) ? surveyRes.value.data : [];
                const active = surveyData.find(s => s.status === 'APPROVED');
                if (active) {
                    const link = `${window.location.origin}/student/cis-login?course_id=${active.course_id}`;
                    setActiveSurvey({ ...active, link });
                }

                const states = {};
                surveyData.forEach(s => {
                    states[s.course_id] = {
                        status: s.status,
                        duration: '7 Days',
                        expires_at: s.expires_at,
                        survey_id: s.survey_id
                    };
                });
                setSurveyStates(states);
            }
        } catch (error) {
            console.error("Critical error in fetchInitialData:", error);
        }
    };

    useEffect(() => {
        if (selectedProgram && selectedScheme) {
            fetchCourses();
        }
    }, [selectedProgram, selectedScheme, selectedClass, selectedSemester]);

    // Smart semester logic
    const getSemestersForClass = (className) => {
        switch (className) {
            case 'FY': return [1, 2];
            case 'SY': return [3, 4];
            case 'TY': return [5, 6];
            default: return [1, 2];
        }
    };

    const handleClassChange = (e) => {
        const newClass = e.target.value;
        setSelectedClass(newClass);
        const validSems = getSemestersForClass(newClass);
        setSelectedSemester(validSems[0].toString());
    };

    const fetchCourses = async () => {
        setCoursesLoading(true);
        try {
            const params = {
                program_id: selectedProgram,
                scheme_id: selectedScheme,
                class_year: selectedClass,
                semester: selectedSemester
            };
            const response = await api.get('academics/courses/', { params });
            // Show all courses for the HOD to manage
            setCourses(response.data);

            response.data.forEach(course => {
                fetchCosForCourse(course.course_id);
            });
        } catch (error) {
            console.error("Error fetching courses:", error);
        } finally {
            setCoursesLoading(false);
        }
    };

    const fetchCosForCourse = async (courseId) => {
        try {
            const response = await api.get(`academics/courses/${courseId}/cos/`);
            setCourseCos(prev => ({ ...prev, [courseId]: response.data }));
        } catch (error) {
            console.error(`Error fetching COs for course ${courseId}:`, error);
        }
    };

    const fetchResponses = async (courseId, surveyId) => {
        try {
            // Need an endpoint for responses. For now mock data based on students.
            const res = await api.get(`surveys/${surveyId}/responses/`);
            setSurveyResponses(prev => ({ ...prev, [courseId]: res.data }));
        } catch (err) {
            console.error("Error fetching responses:", err);
        }
    };

    const [editingCourseId, setEditingCourseId] = useState(null);
    const [tempQuestions, setTempQuestions] = useState({});

    const handleEditToggle = async (courseId, initialCos) => {
        if (editingCourseId === courseId) {
            const updatedCos = initialCos.map((co, idx) => ({
                ...co,
                description: tempQuestions[courseId][idx]
            }));

            setCourseCos(prev => ({ ...prev, [courseId]: updatedCos }));
            setEditingCourseId(null);
            alert("Survey questions updated locally. They will be saved to this survey upon approval.");
        } else {
            setEditingCourseId(courseId);
            setTempQuestions(prev => ({
                ...prev,
                [courseId]: initialCos.map(co => co.description)
            }));
        }
    };

    const handleQuestionChange = (courseId, idx, val) => {
        setTempQuestions(prev => ({
            ...prev,
            [courseId]: prev[courseId].map((q, i) => i === idx ? val : q)
        }));
    };

    const handleApprove = async (courseId, courseName, courseCode) => {
        const state = surveyStates[courseId];
        const isApproved = state?.status === 'APPROVED';

        if (isApproved) {
            if (window.confirm("Close survey early?")) {
                try {
                    await api.patch(`surveys/${state.survey_id}/`, { status: 'CLOSED', is_active: false });
                    setSurveyStates(prev => ({ ...prev, [courseId]: { ...prev[courseId], status: 'CLOSED' } }));
                    if (activeSurvey?.survey_id === state.survey_id) setActiveSurvey(null);
                } catch (err) { alert("Failed to close survey"); }
            }
            return;
        }

        const durationDays = parseInt(surveyStates[courseId]?.duration || '7');
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + durationDays);

        const currentCos = courseCos[courseId] || [];
        const questionsPayload = currentCos.map(co => ({
            co_id: co.co_id,
            question_text: co.description // Store the raw description, Co1.js will format it as before
        }));

        try {
            const payload = {
                survey_name: `CES - ${courseCode}`,
                survey_category: 'course_exit',
                academic_year: academicYear || '2025-26',
                semester: parseInt(selectedSemester),
                course_id: courseId,
                status: 'APPROVED',
                expires_at: expiry.toISOString(),
                is_active: true,
                questions: questionsPayload
            };
            const res = await api.post('surveys/', payload);
            const link = `${window.location.origin}/student/cis-login?course_id=${courseId}`;

            setSurveyStates(prev => ({
                ...prev,
                [courseId]: { status: 'APPROVED', duration: `${durationDays} Days`, expires_at: expiry.toISOString(), survey_id: res.data.survey_id }
            }));
            setActiveSurvey({ ...res.data, link });
            alert(`Survey Approved! Expiry: ${expiry.toLocaleDateString()}`);
        } catch (err) {
            console.error("Failed to approve survey:", err);
            alert("API Error: Survey Master could not be created.");
        }
    };

    const handleDurationChange = (courseId, duration) => {
        setSurveyStates(prev => ({ ...prev, [courseId]: { ...prev[courseId], duration } }));
    };

    const handleCopy = (link) => {
        if (!link) return;
        navigator.clipboard.writeText(link);
        alert("Link copied!");
    };

    const formatQuestion = (description, coNumber, courseCode, idx, course) => {
        if (!description) return '';
        let desc = description.trim();
        if (desc.endsWith('.')) desc = desc.slice(0, -1);

        // Standardize CO number to format [CourseAbbr].[Index]
        // Use course_abbr if available (e.g. CO301), else fall back to numbers in code
        let prefix = "";
        if (course && course.course_abbr) {
            prefix = course.course_abbr;
        } else {
            const courseNumMatch = courseCode.match(/\d+/);
            prefix = courseNumMatch ? `CO${courseNumMatch[0]}` : "CO";
        }

        // Handle coNumber which might be "co1", ".1", "CO301.1" etc.
        let coIndex = idx + 1;
        if (coNumber) {
            const coIndexMatch = coNumber.match(/\d+$/); // Get trailing digits
            if (coIndexMatch) coIndex = coIndexMatch[0];
        }

        const formattedCo = `${prefix}.${coIndex}`;
        return `${formattedCo} - Are you able to ${desc.charAt(0).toLowerCase() + desc.slice(1)}?`;
    };

    const ResponseTable = ({ courseId, surveyId }) => {
        const responses = surveyResponses[courseId] || [];
        const cos = courseCos[courseId] || [];

        // Calculation Logic
        const stats = cos.map(co => {
            const coAnswers = responses.map(r => r.answers?.[co.co_id] || 0).filter(v => v > 0);
            const avg = coAnswers.length > 0 ? (coAnswers.reduce((a, b) => a + b, 0) / coAnswers.length).toFixed(2) : 0;
            const countAboveAvg = coAnswers.filter(v => v >= parseFloat(avg)).length;
            const percentAboveAvg = coAnswers.length > 0 ? ((countAboveAvg / coAnswers.length) * 100).toFixed(2) : 0;

            // CO Attainment Logic (Simplified: 1: <50%, 2: 50-70%, 3: >70%)
            let attainment = 0;
            if (percentAboveAvg > 70) attainment = 3;
            else if (percentAboveAvg > 50) attainment = 2;
            else if (percentAboveAvg > 0) attainment = 1;

            return { avg, countAboveAvg, total: coAnswers.length, percentAboveAvg, attainment };
        });

        return (
            <div className="stats-table-container mt-4 overflow-auto rounded">
                <table className="table table-sm table-bordered stats-custom-table mb-0">
                    <thead>
                        <tr className="bg-light text-center align-middle">
                            <th className="px-3" style={{ minWidth: '150px' }}>Enrollment No.</th>
                            <th style={{ minWidth: '80px' }}>Roll No.</th>
                            <th style={{ minWidth: '200px' }}>Name of Student</th>
                            {cos.map(co => (
                                <th key={co.co_id} className="bg-fath-blue-header co-header-cell">
                                    {co.co_number.toUpperCase()}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {responses.length > 0 ? (
                            <>
                                {responses.map((r, i) => (
                                    <tr key={i} className="align-middle">
                                        <td className="ps-3 fw-semibold text-muted">{r.enrollment}</td>
                                        <td className="text-center">{r.roll_no}</td>
                                        <td>{r.name}</td>
                                        {cos.map(co => (
                                            <td key={co.co_id} className="text-center fw-bold">
                                                {r.answers?.[co.co_id] ? (
                                                    <span className="text-dark">{r.answers[co.co_id]}</span>
                                                ) : (
                                                    <span className="text-muted opacity-50">-</span>
                                                ) || '-'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {/* FA-TH Summary Rows */}
                                <tr className="bg-fath-summary-light fw-bold border-top-2">
                                    <td colSpan="3" className="text-uppercase ps-3">Number of Students Appeared</td>
                                    {stats.map((s, i) => <td key={i} className="text-center">{s.total}</td>)}
                                </tr>
                                <tr className="bg-fath-summary-light fw-bold">
                                    <td colSpan="3" className="text-uppercase ps-3">Number of Students getting equal and more than average</td>
                                    {stats.map((s, i) => <td key={i} className="text-center">{s.countAboveAvg}</td>)}
                                </tr>
                                <tr className="bg-fath-summary-light fw-bold">
                                    <td colSpan="3" className="text-uppercase ps-3">% of Student scored more than average</td>
                                    {stats.map((s, i) => <td key={i} className="text-center">{s.percentAboveAvg}%</td>)}
                                </tr>
                                <tr className="bg-fath-summary-light fw-bold footer-attainment-row">
                                    <td colSpan="3" className="text-uppercase ps-3">CO Wise % Average of Course Outcome</td>
                                    {stats.map((s, i) => <td key={i} className="text-center text-fath-blue">{s.avg}</td>)}
                                </tr>
                                <tr className="bg-fath-summary-footer fw-bold border-top-2">
                                    <td colSpan="3" className="text-uppercase ps-3 text-fath-blue">CO Attainment Level</td>
                                    {stats.map((s, i) => <td key={i} className="text-center text-fath-blue fs-5">{s.attainment}</td>)}
                                </tr>
                            </>
                        ) : (
                            <tr><td colSpan={3 + cos.length} className="text-center py-4 text-muted">No student data found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    const [showActiveModal, setShowActiveModal] = useState(false);

    const ActiveSurveysModal = () => {
        const activeSurveys = Object.entries(surveyStates)
            .filter(([_, state]) => state.status === 'APPROVED')
            .map(([courseId, state]) => ({
                courseId,
                ...state,
                course: courses.find(c => c.course_id === parseInt(courseId))
            }));

        if (!showActiveModal) return null;

        return (
            <div className="custom-modal-overlay">
                <div className="custom-modal-content p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="mb-0 fw-bold">Active Survey Summary</h4>
                        <button className="btn-close" onClick={() => setShowActiveModal(false)}></button>
                    </div>
                    <div className="active-surveys-list">
                        {activeSurveys.length > 0 ? (
                            <table className="table table-hover">
                                <thead className="table-light">
                                    <tr>
                                        <th>Course</th>
                                        <th>Expiry</th>
                                        <th>Link</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeSurveys.map(s => {
                                        const fullLink = `${window.location.origin}/student/cis-login?course_id=${s.courseId}`;
                                        return (
                                            <tr key={s.courseId}>
                                                <td>
                                                    <div className="fw-bold">{s.course?.course_code}</div>
                                                    <div className="small text-muted">{s.course?.course_name}</div>
                                                </td>
                                                <td>{new Date(s.expires_at).toLocaleDateString()}</td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <code className="small text-primary bg-light p-1 rounded" style={{ fontSize: '0.7rem' }}>
                                                            {fullLink}
                                                        </code>
                                                        <button
                                                            className="btn btn-sm btn-link p-0"
                                                            onClick={() => handleCopy(fullLink)}
                                                            title="Copy Link"
                                                        >
                                                            Copy
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-center py-4 text-muted">No surveys are currently active.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const filteredCourses = courses.filter(c =>
        c.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.course_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="cescreate-wrapper">
            <ActiveSurveysModal />
            <div className="cescreate-main">
                <div className="cescreate-card">
                    {/* Survey Link Box */}
                    {activeSurvey && filteredCourses.length > 0 && (
                        <div className="survey-link-status-box mb-4 no-highlight">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <h5 className="link-box-title mb-0">Student Course Exit Survey Link</h5>
                                <span className="badge bg-light text-danger fw-bold border border-danger">
                                    Time left: {timeLeft}
                                </span>
                            </div>
                            <div className="link-input-group">
                                <input
                                    type="text"
                                    className="form-control bg-white"
                                    readOnly
                                    value={activeSurvey.link}
                                />
                                <button
                                    className="btn btn-primary px-4 ms-2"
                                    onClick={() => handleCopy(activeSurvey.link)}
                                >
                                    Copy Link
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="filter-card p-4 border rounded mb-4">
                        <div className="row g-3">
                            <div className="col-md">
                                <label className="filter-label uppercase mb-2">DEPARTMENT</label>
                                <select className="form-select" value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)}>
                                    <option value="">Select Department</option>
                                    {programs.map(p => <option key={p.program_id} value={p.program_id}>{p.program_name}</option>)}
                                </select>
                            </div>
                            <div className="col-md">
                                <label className="filter-label uppercase mb-2">SCHEME</label>
                                <select className="form-select" value={selectedScheme} onChange={(e) => setSelectedScheme(e.target.value)}>
                                    <option value="">Select Scheme</option>
                                    {schemes.map(s => <option key={s.scheme_id} value={s.scheme_id}>{s.scheme_name}</option>)}
                                </select>
                            </div>
                            <div className="col-md">
                                <label className="filter-label uppercase mb-2">YEAR</label>
                                <select className="form-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                                    <option value="2024 - 25">2024 - 25</option>
                                    <option value="2025 - 26">2025 - 26</option>
                                </select>
                            </div>
                            <div className="col-md">
                                <label className="filter-label uppercase mb-2">CLASS</label>
                                <select className="form-select" value={selectedClass} onChange={handleClassChange}>
                                    <option value="FY">FY - {selectedDivision}</option>
                                    <option value="SY">SY - {selectedDivision}</option>
                                    <option value="TY">TY - {selectedDivision}</option>
                                </select>
                            </div>
                            <div className="col-md" style={{ maxWidth: '100px' }}>
                                <label className="filter-label uppercase mb-2">DIV</label>
                                <select className="form-select" value={selectedDivision} onChange={(e) => setSelectedDivision(e.target.value)}>
                                    {['A', 'B', 'C', 'D'].map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="col-md">
                                <label className="filter-label uppercase mb-2">SEMESTER</label>
                                <select className="form-select" value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
                                    {getSemestersForClass(selectedClass).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="search-bar-row mt-4">
                            <input
                                type="text"
                                className="form-control search-input-pill"
                                placeholder="Search course by name or code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <h5 className="fw-bold text-dark mb-4 d-flex align-items-center justify-content-between">
                        Question Sets
                        <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setShowActiveModal(true)}
                        >
                            View All Active Surveys
                        </button>
                    </h5>

                    <div className="course-sets-container">
                        {coursesLoading ? (
                            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
                        ) : filteredCourses.length > 0 ? (
                            filteredCourses.map(course => (
                                <div key={course.course_id} className="course-detail-card mb-4 border rounded p-4 shadow-sm bg-white">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div className="course-header-left">
                                            <h3 className="course-main-code fw-bold mb-0">{course.course_code}</h3>
                                            <p className="text-muted small mb-2">{course.course_name}</p>
                                            <div className="course-info-row d-flex gap-4">
                                                <p className="mb-0 small fw-bold">Scheme: <span className="text-dark fw-semibold ms-1">{schemes.find(s => s.scheme_id === course.scheme_id)?.scheme_name || '--'}</span></p>
                                                <p className="mb-0 small fw-bold">Faculty: <span className="text-dark fw-semibold ms-1">{course.faculty_assigned_name || 'Not Assigned'}</span></p>
                                            </div>
                                        </div>
                                        <div className="course-header-right">
                                            <span className={`status-badge-compact ${surveyStates[course.course_id]?.status === 'APPROVED' ? 'approved' : surveyStates[course.course_id]?.status === 'CLOSED' ? 'closed' : 'draft'}`}>
                                                {surveyStates[course.course_id]?.status === 'APPROVED' ? <FaCheckCircle className="me-1" /> : <FaExclamationCircle className="me-1" />}
                                                {surveyStates[course.course_id]?.status || 'DRAFT'}
                                            </span>
                                        </div>
                                    </div>

                                    {!showStats[course.course_id] ? (
                                        <div className="questions-section mt-3 pt-3 border-top">
                                            <h6 className="uppercase small fw-bold text-secondary mb-3">QUESTIONS:</h6>
                                            <div className="questions-list">
                                                {courseCos[course.course_id]?.map((co, idx) => (
                                                    <div key={co.co_id} className="question-item mb-2 d-flex gap-3">
                                                        {editingCourseId === course.course_id ? (
                                                            <div className="w-100 d-flex gap-2">
                                                                <span className="fw-bold text-primary">Q{idx + 1}</span>
                                                                <input
                                                                    type="text"
                                                                    className="form-control form-control-sm"
                                                                    value={tempQuestions[course.course_id]?.[idx] || ''}
                                                                    onChange={(e) => handleQuestionChange(course.course_id, idx, e.target.value)}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <span className="question-text text-dark">{formatQuestion(co.description, co.co_number, course.course_code, idx, course)}</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <ResponseTable courseId={course.course_id} surveyId={surveyStates[course.course_id]?.survey_id} />
                                    )}

                                    <div className="action-row mt-4 d-flex align-items-center gap-3">
                                        {(surveyStates[course.course_id]?.status === 'APPROVED' || surveyStates[course.course_id]?.status === 'CLOSED') && (
                                            <button
                                                className="btn btn-sm btn-info text-white"
                                                onClick={() => {
                                                    const isShowing = !showStats[course.course_id];
                                                    setShowStats(prev => ({ ...prev, [course.course_id]: isShowing }));
                                                    if (isShowing) fetchResponses(course.course_id, surveyStates[course.course_id].survey_id);
                                                }}
                                            >
                                                {showStats[course.course_id] ? 'Show Questions' : 'Show Statistics'}
                                            </button>
                                        )}
                                        <button
                                            className={`btn btn-outline-primary btn-sm px-4 ${surveyStates[course.course_id]?.status === 'APPROVED' ? 'disabled' : ''}`}
                                            onClick={() => handleEditToggle(course.course_id, courseCos[course.course_id])}
                                            disabled={surveyStates[course.course_id]?.status === 'APPROVED'}
                                        >
                                            {editingCourseId === course.course_id ? 'Save' : 'Edit'}
                                        </button>
                                        <select
                                            className="form-select form-select-sm w-auto"
                                            value={surveyStates[course.course_id]?.duration || '7'}
                                            onChange={(e) => handleDurationChange(course.course_id, e.target.value)}
                                            disabled={surveyStates[course.course_id]?.status === 'APPROVED'}
                                        >
                                            <option value="3">3 Days</option>
                                            <option value="7">7 Days</option>
                                            <option value="15">15 Days</option>
                                        </select>
                                        <button
                                            className={`btn btn-sm px-5 ${surveyStates[course.course_id]?.status === 'APPROVED' ? 'btn-danger' : 'btn-primary'}`}
                                            onClick={() => handleApprove(course.course_id, course.course_name, course.course_code)}
                                        >
                                            {surveyStates[course.course_id]?.status === 'APPROVED' ? 'Close Early' : 'Approve'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state text-center py-5 rounded bg-light border-dashed">
                                <FaExclamationCircle className="text-muted mb-3" size={30} />
                                <h6>No courses found for selected filters</h6>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cescreate;
