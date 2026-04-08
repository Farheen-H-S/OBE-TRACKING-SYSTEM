import React, { useState, useEffect } from 'react';
import './Cescreate.css';
import api from '../../../utils/axios';
import { FaCopy, FaCheckCircle, FaExclamationCircle, FaSearch, FaFilter, FaEdit, FaCheck } from 'react-icons/fa';
import { getDefaultSemester, getCachedSemesterType } from '../../../utils/semesterUtils';
import { useFilters } from '../../../context/FilterContext';
import { useDebounce } from '../../../utils/useDebounce';

const Cescreate = () => {
    const {
        selectedDept: selectedProgram, setSelectedDept: setSelectedProgram,
        selectedScheme, setSelectedScheme,
        selectedBatch, setSelectedBatch,
        selectedYear, setSelectedYear,
        selectedClass, setSelectedClass,
        selectedSemester, setSelectedSemester,
        selectedDivision, setSelectedDivision,
        departments: programs, schemes,
        validateContext
    } = useFilters();

    const requiredFields = ['dept', 'batch', 'year', 'class', 'semester', 'division'];
    const { isValid, missingFields } = validateContext(requiredFields);

    // Dynamic years list
    const years = [];
    for (let i = 2019; i <= 2030; i++) {
        years.push(`${i} - ${(i + 1).toString().slice(-2)}`);
    }

    // Academic state
    const [academicYear, setAcademicYear] = useState('');
    const [courses, setCourses] = useState([]);
    const [coursesLoading, setCoursesLoading] = useState(false);

    // Search state
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Survey states
    const [surveyStates, setSurveyStates] = useState({}); // { courseId: { status, duration, link } }
    const [courseCos, setCourseCos] = useState({}); // { courseId: [cos] }

    // Link box state
    const [activeSurvey, setActiveSurvey] = useState(null);
    const [timeLeft, setTimeLeft] = useState("");
    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [showActiveModal, setShowActiveModal] = useState(false);

    // Stats state
    const [showStats, setShowStats] = useState({}); // { courseId: boolean }
    const [surveyStatsData, setSurveyStatsData] = useState({}); // { courseId: { responses, statements, survey } }

    useEffect(() => {
        fetchInitialData();
    }, []);

    // Smart semester options based on class
    const semesterOptions = (() => {
        switch (selectedClass) {
            case 'FY': return ['1', '2'];
            case 'SY': return ['3', '4'];
            case 'TY': return ['5', '6'];
            default: return ['1', '2', '3', '4', '5', '6'];
        }
    })();

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
            const [setupRes, surveyRes] = await Promise.allSettled([
                api.get('academics/academic-setup/'),
                api.get('surveys/')
            ]);

            if (setupRes.status === 'fulfilled' && setupRes.value.data) {
                const setup = setupRes.value.data;
                if (setup.academic_year) {
                    setAcademicYear(setup.academic_year);
                }
            }

            if (surveyRes.status === 'fulfilled') {
                const surveyData = Array.isArray(surveyRes.value.data) ? surveyRes.value.data : [];

                // Do NOT auto-select the first active survey.
                // Leave selectedCourseId and activeSurvey as empty/null by default,
                // forcing the user to select from the dropdown.

                const states = {};
                // Process newest to oldest (default sort from API)
                // But prioritize APPROVED status: only overwrite if current is not APPROVED
                // or if we found a more recent APPROVED one.
                surveyData.forEach(s => {
                    const existing = states[s.course_id];
                    if (!existing || (existing.status !== 'APPROVED' && s.status === 'APPROVED') ||
                        (existing.status === s.status && s.survey_id > existing.survey_id)) {
                        states[s.course_id] = {
                            status: s.status,
                            duration: '7',
                            expires_at: s.expires_at,
                            survey_id: s.survey_id
                        };
                    }
                });
                setSurveyStates(states);
            }
        } catch (error) {
            console.error("Critical error in fetchInitialData:", error);
        }
    };

    const handleCourseChange = (courseId) => {
        if (!courseId) {
            setSelectedCourseId("");
            setActiveSurvey(null);
            return;
        }
        const id = parseInt(courseId);
        setSelectedCourseId(id);
        const state = surveyStates[id];
        if (state && state.status === 'APPROVED') {
            const link = `${window.location.origin}/student/cis-login?course_id=${id}`;
            const course = courses.find(c => c.course_id === id);
            setActiveSurvey({
                ...state,
                link,
                course_id: id,
                course_code: course?.course_code,
                course_name: course?.course_name
            });
        } else {
            setActiveSurvey(null);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, [selectedProgram, selectedScheme, selectedBatch, selectedClass, selectedSemester, selectedYear, selectedDivision]);

    const fetchCourses = async () => {
        setCoursesLoading(true);
        try {
            const params = {
                program_id: selectedProgram === 'All' ? '' : selectedProgram,
                scheme_id: selectedScheme === 'All' ? '' : selectedScheme,
                batch_id: selectedBatch === 'All' ? '' : selectedBatch,
                class_year: selectedClass === 'All' ? '' : selectedClass,
                semester: selectedSemester === 'All' ? '' : selectedSemester,
                academic_year: selectedYear
            };
            const response = await api.get('academics/courses/', { params });
            setCourses(response.data);

            response.data.forEach(course => {
                fetchCosForCourse(course.course_id);
            });

            // Sync check: If we have a selectedCourseId, make sure it's actually in this new list of courses.
            // If not, clear the selection so the UI doesn't show a ghost link for a course not in the dropdown.
            if (selectedCourseId) {
                const courseExistsInList = response.data.some(c => String(c.course_id) === String(selectedCourseId));
                const courseHasActiveSurvey = surveyStates[selectedCourseId]?.status === 'APPROVED';
                if (!courseExistsInList || !courseHasActiveSurvey) {
                    setSelectedCourseId("");
                    setActiveSurvey(null);
                }
            }

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
            const res = await api.get(`/surveys/${surveyId}/responses/`);
            // res.data is { survey, statements, responses }

            // Natural Sort Responses by Roll No
            if (res.data && Array.isArray(res.data.responses)) {
                const naturalSort = (a, b) => {
                    const ax = [], bx = [];
                    a.toString().replace(/(\d+)|(\D+)/g, function (_, $1, $2) { ax.push([$1 || Infinity, $2 || ""]); });
                    b.toString().replace(/(\d+)|(\D+)/g, function (_, $1, $2) { bx.push([$1 || Infinity, $2 || ""]); });
                    while (ax.length && bx.length) {
                        const an = ax.shift();
                        const bn = bx.shift();
                        const nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
                        if (nn) return nn;
                    }
                    return ax.length - bx.length;
                };
                res.data.responses.sort((a, b) => naturalSort(a.roll_no || "", b.roll_no || ""));
            }

            setSurveyStatsData(prev => ({ ...prev, [courseId]: res.data }));
        } catch (err) {
            console.error('Failed to fetch responses:', err);
        }
    };

    const handleBulkUpload = async (e, surveyId, courseId) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('survey_id', surveyId);

        try {
            alert('Uploading test data...');
            const res = await api.post('bulk_upload/surveys/upload/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(res.data.message || 'Upload successful');
            // Refresh stats if open
            if (showStats[courseId]) {
                fetchResponses(courseId, surveyId);
            }
        } catch (err) {
            console.error(err);
            alert('Upload failed: ' + (err.response?.data?.error || err.message));
        }
        e.target.value = null; // reset input
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
                [courseId]: { status: 'APPROVED', duration: String(durationDays), expires_at: expiry.toISOString(), survey_id: res.data.survey_id }
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
        const data = surveyStatsData[courseId] || {};
        const responses = data.responses || [];
        const cos = data.statements || courseCos[courseId] || [];

        // Calculation Logic
        const stats = cos.map(co => {
            const coAnswers = responses.map(r => r.answers?.[co.id || co.co_id] || 0).filter(v => v > 0);
            const avg = coAnswers.length > 0 ? (coAnswers.reduce((a, b) => a + b, 0) / coAnswers.length).toFixed(2) : 0;
            const countAboveAvg = coAnswers.filter(v => v >= parseFloat(avg)).length;
            const percentAboveAvg = coAnswers.length > 0 ? ((countAboveAvg / coAnswers.length) * 100).toFixed(2) : 0;

            // CO Attainment formula: (% students >= average) * 3 / 100
            const attainment = coAnswers.length > 0 ? (parseFloat(percentAboveAvg) * 3 / 100).toFixed(2) : 0;

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
                                    {(co.co_number || "").toUpperCase()}
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
                                            <td key={co.id || co.co_id} className="text-center fw-bold">
                                                {r.answers?.[co.id || co.co_id] ? (
                                                    <span className="text-dark">{r.answers[co.id || co.co_id]}</span>
                                                ) : (
                                                    <span className="text-muted opacity-50">-</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {/* FA-TH Summary Rows - Ordered as per expected Excel result */}
                                <tr className="bg-fath-summary-light fw-bold border-top-2">
                                    <td colSpan="3" className="text-uppercase ps-3">Average</td>
                                    {stats.map((s, i) => <td key={i} className="text-center text-fath-blue">{s.avg}</td>)}
                                </tr>
                                <tr className="bg-fath-summary-light fw-bold">
                                    <td colSpan="3" className="text-uppercase ps-3">Number of Students getting equal and more than average</td>
                                    {stats.map((s, i) => <td key={i} className="text-center">{s.countAboveAvg}</td>)}
                                </tr>
                                <tr className="bg-fath-summary-light fw-bold">
                                    <td colSpan="3" className="text-uppercase ps-3">No. of students feedback taken</td>
                                    {stats.map((s, i) => <td key={i} className="text-center text-success">{s.total}</td>)}
                                </tr>
                                <tr className="bg-fath-summary-light fw-bold">
                                    <td colSpan="3" className="text-uppercase ps-3">% of Student scored more than average</td>
                                    {stats.map((s, i) => <td key={i} className="text-center">{s.percentAboveAvg}</td>)}
                                </tr>
                                <tr className="bg-fath-summary-footer fw-bold border-top-2">
                                    <td colSpan="3" className="text-uppercase ps-3 text-fath-blue">CO Attainment</td>
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

    const [surveyFilter, setSurveyFilter] = useState('ALL'); // ALL, ACTIVE, EXPIRED

    const ActiveSurveysModal = () => {
        const allSurveys = Object.entries(surveyStates)
            .map(([courseId, state]) => ({
                courseId: parseInt(courseId),
                ...state,
                course: courses.find(c => c.course_id === parseInt(courseId))
            }));

        const filteredSummary = allSurveys.filter(s => {
            if (surveyFilter === 'ALL') return true;
            if (surveyFilter === 'ACTIVE') return s.status === 'APPROVED';
            if (surveyFilter === 'EXPIRED') return s.status === 'CLOSED';
            return true;
        });

        if (!showActiveModal) return null;

        return (
            <div className="custom-modal-overlay">
                <div className="custom-modal-content p-4" style={{ maxWidth: '800px' }}>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="mb-0 fw-bold">Survey Management Summary</h4>
                        <div className="d-flex gap-2">
                            <select
                                className="form-select form-select-sm"
                                style={{ width: '150px' }}
                                value={surveyFilter}
                                onChange={(e) => setSurveyFilter(e.target.value)}
                            >
                                <option value="ALL">All Surveys</option>
                                <option value="ACTIVE">Active</option>
                                <option value="EXPIRED">Expired/Closed</option>
                            </select>
                            <button className="btn-close" onClick={() => setShowActiveModal(false)}></button>
                        </div>
                    </div>
                    <div className="active-surveys-list overflow-auto" style={{ maxHeight: '60vh' }}>
                        {filteredSummary.length > 0 ? (
                            <table className="table table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Course</th>
                                        <th>Status</th>
                                        <th>Expiry</th>
                                        <th>Link</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSummary.map(s => {
                                        const fullLink = `${window.location.origin}/student/cis-login?course_id=${s.courseId}`;
                                        return (
                                            <tr key={s.courseId}>
                                                <td>
                                                    <div className="fw-bold">{s.course?.course_code}</div>
                                                    <div className="small text-muted">{s.course?.course_name}</div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${s.status === 'APPROVED' ? 'bg-success' : 'bg-secondary'}`}>
                                                        {s.status === 'APPROVED' ? 'Active' : 'Expired'}
                                                    </span>
                                                </td>
                                                <td>{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : 'N/A'}</td>
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
                            <p className="text-center py-4 text-muted">No surveys found for this filter.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const filteredCourses = courses.filter(c => {
        const term = debouncedSearchTerm.toLowerCase();
        return (c.course_name || "").toLowerCase().includes(term) ||
            (c.course_code || "").toLowerCase().includes(term) ||
            (c.course_title || "").toLowerCase().includes(term) ||
            (c.course_abbr || "").toLowerCase().includes(term);
    });

    return (
        <div className="cescreate-wrapper">
            <ActiveSurveysModal />
            <div className="cescreate-main">
                <div className="cescreate-card">
                    {/* Survey Link Box */}
                    <div className="survey-link-status-box mb-4 no-highlight">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="d-flex align-items-center gap-3">
                                <h5 className="link-box-title mb-0">Student Course Exit Survey Link</h5>
                                <select
                                    className="form-select form-select-sm"
                                    style={{ width: '250px' }}
                                    value={selectedCourseId}
                                    onChange={(e) => handleCourseChange(e.target.value)}
                                >
                                    <option value="">Select Course...</option>
                                    {courses.filter(c => surveyStates[c.course_id]?.status === 'APPROVED').map(c => (
                                        <option key={c.course_id} value={c.course_id}>
                                            {c.course_code} - {c.course_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {activeSurvey && selectedCourseId && (
                                <span className="badge bg-light text-danger fw-bold border border-danger">
                                    Time left: {timeLeft}
                                </span>
                            )}
                        </div>
                        {activeSurvey && selectedCourseId ? (
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
                        ) : (
                            <div className="alert alert-info py-2 mb-0 small">
                                {selectedCourseId ? "No active survey for selected course." : "Please select a course to see its active survey link."}
                            </div>
                        )}
                    </div>

                    {!isValid ? (
                        <div className="alert alert-warning shadow-sm border-warning d-flex align-items-center gap-3 p-4 mb-4">
                            <FaExclamationCircle className="text-warning fs-3" />
                            <div>
                                <h5 className="fw-bold mb-1">Academic Context Required</h5>
                                <p className="mb-0">Please select the remaining filters in the top bar to proceed: <span className="fw-bold text-dark">{missingFields.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(', ')}</span></p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="search-bar-row mb-4">
                                <input
                                    type="text"
                                    className="form-control search-input-pill"
                                    placeholder="Search course by code, name, title or abbreviation..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <h5 className="fw-bold text-dark mb-4 d-flex align-items-center justify-content-between">
                                Question Sets
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => setShowActiveModal(true)}
                                >
                                    View All Surveys
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

                                                {surveyStates[course.course_id]?.status === 'APPROVED' && (
                                                    <>
                                                        <input
                                                            type="file"
                                                            id={`bulkUpload-${course.course_id}`}
                                                            style={{ display: 'none' }}
                                                            accept=".xlsx,.xls"
                                                            onChange={(e) => handleBulkUpload(e, surveyStates[course.course_id].survey_id, course.course_id)}
                                                        />
                                                        <button
                                                            className="btn btn-sm text-dark bg-warning border border-dark rounded-0 fw-bold px-2 mx-1"
                                                            style={{ boxShadow: '2px 2px 0px black' }}
                                                            onClick={() => {
                                                                if (window.confirm("DATA SEEDING ONLY: This will overwrite existing survey answers. Continue?")) {
                                                                    document.getElementById(`bulkUpload-${course.course_id}`).click();
                                                                }
                                                            }}
                                                            title="DEVELOPMENT ONLY: Bulk Seed Responses"
                                                        >
                                                            [DEV] SEED DATA
                                                        </button>
                                                        <button
                                                            className="btn btn-sm text-dark bg-info border border-dark rounded-0 fw-bold px-2 mx-1"
                                                            style={{ boxShadow: '2px 2px 0px black' }}
                                                            onClick={() => window.open(`${api.defaults.baseURL}bulk_upload/surveys/template/?survey_id=${surveyStates[course.course_id].survey_id}`, '_blank')}
                                                        >
                                                            [DEV] TEMPLATE
                                                        </button>
                                                        <button
                                                            className="btn btn-sm text-white bg-danger border border-dark rounded-0 fw-bold px-2 mx-1"
                                                            style={{ boxShadow: '2px 2px 0px black' }}
                                                            onClick={async () => {
                                                                if (window.confirm("EMERGENCY CLEANUP: Delete duplicate/orphaned columns?")) {
                                                                    try {
                                                                        const res = await api.post('surveys/emergency-cleanup/');
                                                                        alert(res.data.message);
                                                                    } catch(err) {
                                                                        alert("Cleanup failed.");
                                                                    }
                                                                }
                                                            }}
                                                            title="Fix Duplicates"
                                                        >
                                                            1-Click DB Fix
                                                        </button>
                                                    </>
                                                )}
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Cescreate;
