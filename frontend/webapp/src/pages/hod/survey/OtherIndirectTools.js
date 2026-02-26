import React, { useState, useEffect } from 'react';
import './OtherIndirectTools.css';
import api from '../../../utils/axios';
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { useFilters } from '../../../context/FilterContext';

const SURVEY_TOOLS = [
    { id: 'co-curricular', label: 'Co-curricular / Extra Curricular Activity Feedback', hasActivity: true },
    { id: 'resource-person', label: 'Resource Person Feedback', hasActivity: true },
    { id: 'program-exit', label: 'Program Exit Survey', hasActivity: false },
    { id: 'alumni', label: 'Alumni Feedback', hasActivity: false },
];

const ACTIVITY_TYPES = ['Expert Lecture', 'Industry Visit', 'Value Added Program'];

const ATTAINMENT_LEVELS = [
    { level: 5, label: 'Very High', min: 2.50, max: 3.00, score: 3 },
    { level: 4, label: 'High', min: 2.00, max: 2.49, score: 2.5 },
    { level: 3, label: 'Medium', min: 1.50, max: 1.99, score: 2 },
    { level: 2, label: 'Low', min: 1.00, max: 1.49, score: 1.5 },
    { level: 1, label: 'Very Low', min: 0, max: 0.99, score: 1 },
];

const getAttainmentLevel = (avg) => {
    if (avg === null || avg === undefined) return null;
    for (const al of ATTAINMENT_LEVELS) {
        if (avg >= al.min && avg <= al.max) return al;
    }
    return ATTAINMENT_LEVELS[4];
};

const PO_QUESTIONS = {
    'PO 1': 'Can you apply basic mathematics, science, and engineering knowledge to solve engineering problems?',
    'PO 2': 'Can you identify and analyze engineering problems using standard methods?',
    'PO 3': 'Can you design solutions for technical problems and help design systems or components?',
    'PO 4': 'Can you use modern engineering tools to perform tests and measurements?',
    'PO 5': 'Can you use technology responsibly considering society, environment, and ethics?',
    'PO 6': 'Can you manage engineering projects and work effectively in a team or as a leader?',
    'PO 7': 'Do you update your knowledge to keep up with new technologies?',
};

const PSO_QUESTIONS = {
    'Computer Engineering': {
        'PSO 1': 'Can you use modern computer software and hardware technologies?',
        'PSO 2': 'Can you maintain computer related software and hardware systems?',
        'PSO 3': 'Can you solve real time computational problems using knowledge from different subjects?',
    },
    'Information Technology': {
        'PSO 1': 'Can you use the latest information technology tools and technologies?',
        'PSO 2': 'Can you maintain information processes using modern IT and communication technologies?',
    },
    'Mechanical Engineering': {
        'PSO 1': 'Can you use mechanical engineering software for design, drafting, manufacturing, maintenance, and documentation?',
        'PSO 2': 'Can you maintain mechanical engineering equipment and instruments?',
        'PSO 3': 'Can you manage mechanical engineering processes using proper equipment, materials, and quality control methods?',
    },
    'Civil Engineering': {
        'PSO 1': 'Can you plan and design civil engineering construction work with good quality and cost efficiency?',
        'PSO 2': 'Can you execute and maintain construction work using proper materials and equipment?',
        'PSO 3': 'Can you estimate civil engineering projects and prepare bid quotations?',
    },
    'Electrical Engineering': {
        'PSO 1': 'Can you maintain different types of electrical machines and equipment?',
        'PSO 2': 'Can you maintain electrical power systems?',
        'PSO 3': 'Can you use instruments and equipment to measure electrical parameters?',
    }
};


const getSurveyInquiry = (stmt, programName = '') => {
    if (!stmt || !stmt.number) return stmt?.description || 'No description available.';
    const key = stmt.number;
    if (String(key).startsWith('PO')) {
        return PO_QUESTIONS[key] || stmt.description || 'No description available.';
    }
    if (String(key).startsWith('PSO')) {
        const deptPso = PSO_QUESTIONS[programName];
        if (deptPso && deptPso[key]) return deptPso[key];
        return stmt.description || 'No description available.';
    }
    return stmt.description || 'No description available.';
};

const OtherIndirectTools = () => {
    const {
        selectedDept: selectedProgram,
        selectedBatch, setSelectedBatch,
        selectedYear, setSelectedYear,
        selectedClass, setSelectedClass,
        selectedSemester: selectedSem, setSelectedSemester: setSelectedSem,
        selectedDivision, setSelectedDivision,
        departments: programs
    } = useFilters();

    const currentProgramObj = programs.find(p => String(p.program_id) === String(selectedProgram));
    const programName = currentProgramObj ? currentProgramObj.program_name : '';

    // Generate academic years locally (FilterContext doesn't export years)
    const academicYears = [];
    for (let i = 2019; i <= 2030; i++) {
        academicYears.push(`${i} - ${(i + 1).toString().slice(-2)}`);
    }

    const [selectedTool, setSelectedTool] = useState(SURVEY_TOOLS[0]);
    const [activityType, setActivityType] = useState(ACTIVITY_TYPES[0]);
    // User types only the suffix; full title = `${activityType} — ${activityDetail}`
    const [activityDetail, setActivityDetail] = useState('');
    const [calcDuration, setCalcDuration] = useState('48');
    const [conductedDate, setConductedDate] = useState(new Date().toISOString().split('T')[0]);
    const [rpName, setRpName] = useState('');
    const [rpDesignation, setRpDesignation] = useState('');
    const [rpCompany, setRpCompany] = useState('');
    const [rpAddress, setRpAddress] = useState('');

    const [existingSurveys, setExistingSurveys] = useState([]);
    const [loadingSurveys, setLoadingSurveys] = useState(false);

    const [pos, setPos] = useState([]);
    const [psos, setPsos] = useState([]);
    const [loadingStmts, setLoadingStmts] = useState(false);

    const [surveyState, setSurveyState] = useState(null);
    const [timeLeft, setTimeLeft] = useState('');
    const [showStats, setShowStats] = useState(false);
    const [responses, setResponses] = useState([]);
    const [showActiveModal, setShowActiveModal] = useState(false);
    const [activeSurveys, setActiveSurveys] = useState([]);
    const [fetchedStatements, setFetchedStatements] = useState([]);

    // Smart filtering for semesters
    const availableSemesters = selectedClass === 'FY' ? ['1', '2'] :
        selectedClass === 'SY' ? ['3', '4'] :
            selectedClass === 'TY' ? ['5', '6'] : ['1', '2', '3', '4', '5', '6'];

    useEffect(() => {
        if (selectedClass !== 'All' && !availableSemesters.includes(selectedSem)) {
            setSelectedSem(availableSemesters[0]);
        }
    }, [selectedClass, availableSemesters, selectedSem, setSelectedSem]);

    const isRP = selectedTool.id === 'resource-person';

    // localStorage key — unique per tool/program/year/class/sem
    const surveyKey = `oit_survey_${selectedTool.id}_${selectedProgram}_${selectedYear.replace(/\s/g, '')}_${selectedClass}_${selectedSem}`;

    const computedTitle = selectedTool.hasActivity
        ? (activityDetail.trim() ? `${activityType} — ${activityDetail.trim()}` : activityType)
        : '';

    // ── Lifecycle ────────────────────────────────────────────────────────
    useEffect(() => { if (selectedProgram && selectedProgram !== 'All') fetchStatements(); }, [selectedProgram]);
    useEffect(() => {
        const saved = localStorage.getItem(surveyKey);
        setSurveyState(saved ? JSON.parse(saved) : null);
        setShowStats(false);
    }, [surveyKey]);
    useEffect(() => {
        const timer = setInterval(() => {
            if (!surveyState?.expires_at) { setTimeLeft(''); return; }
            const diff = new Date(surveyState.expires_at) - new Date();
            if (diff <= 0) { setTimeLeft('Expired'); return; }
            const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000),
                m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
        }, 1000);
        return () => clearInterval(timer);
    }, [surveyState]);

    useEffect(() => {
        if (isRP && selectedProgram && selectedProgram !== 'All') {
            fetchExistingSurveys();
        }
    }, [isRP, activityType, selectedProgram]);

    const fetchExistingSurveys = async () => {
        setLoadingSurveys(true);
        try {
            const res = await api.get(`/surveys/lookup/?activity_type=${activityType}&program_id=${selectedProgram}`);
            setExistingSurveys(res.data);
        } catch (e) {
            console.error('Failed to fetch existing surveys:', e);
        } finally {
            setLoadingSurveys(false);
        }
    };

    const handleExistingSurveyChange = (surveyId) => {
        const survey = existingSurveys.find(s => s.survey_id === parseInt(surveyId));
        if (survey) {
            setActivityDetail(survey.activity_title || '');
            setRpName(survey.resource_person_name || '');
            setRpDesignation(survey.resource_person_designation || '');
            setRpCompany(survey.resource_person_company || '');
            setRpAddress(survey.resource_person_address || '');
            if (survey.conducted_date) setConductedDate(survey.conducted_date);
        } else {
            setActivityDetail('');
            setRpName('');
            setRpDesignation('');
            setRpCompany('');
            setRpAddress('');
        }
    };

    const fetchStatements = async () => {
        setLoadingStmts(true);
        try {
            const [poRes, psoRes] = await Promise.all([
                api.get('/academics/pos/', { params: { program_id: selectedProgram } }),
                api.get('/academics/psos/', { params: { program_id: selectedProgram } })
            ]);
            setPos(Array.isArray(poRes.data) ? poRes.data : []);
            setPsos(Array.isArray(psoRes.data) ? psoRes.data : []);
        } catch (e) { console.error('PO/PSO fetch error:', e); }
        finally { setLoadingStmts(false); }
    };

    const allStatements = [
        ...pos.map((p, i) => ({ type: 'PO', id: p.po_number, number: p.po_number || `PO ${i + 1}`, description: p.description })),
        ...psos.map((p, i) => ({ type: 'PSO', id: p.pso_number, number: p.pso_number || `PSO ${i + 1}`, description: p.description })),
    ];

    // ── Survey link ──────────────────────────────────────────────────────
    const buildLink = (id) => {
        const params = new URLSearchParams({
            survey: id || surveyState?.backendId || '',
            type: selectedTool.id,
            program: selectedProgram,
            class: selectedClass,
            div: selectedDivision,
            year: selectedYear,
            sem: selectedSem,
        });
        if (selectedTool.hasActivity) {
            params.set('activity_type', activityType);
            params.set('activity_title', activityDetail.trim() ? `${activityType} — ${activityDetail.trim()}` : activityType);
        }
        return `${window.location.origin}/student/oit-login?${params.toString()}`;
    };

    // ── Actions ──────────────────────────────────────────────────────────
    const handleApprove = async () => {
        if (surveyState?.status === 'APPROVED') {
            if (window.confirm('Close this survey early?')) {
                const u = { ...surveyState, status: 'CLOSED' };
                localStorage.setItem(surveyKey, JSON.stringify(u));
                setSurveyState(u);
            }
            return;
        }
        if (selectedTool.hasActivity && !activityDetail.trim()) {
            alert('Please select or enter the activity title before approving.');
            return;
        }
        if (selectedTool.hasActivity && !conductedDate) {
            alert('Please select the date when the survey was conducted.');
            return;
        }
        if (selectedTool.id === 'resource-person' && !rpName && activityType !== 'Industry Visit') {
            alert('Please select an existing activity to pull resource person details.');
            return;
        }

        try {
            // Create backend record
            const duration = parseInt(calcDuration || '48');
            const expiry = new Date(); expiry.setHours(expiry.getHours() + duration);

            // Fetch PO/PSO to create questions
            const [poRes, psoRes] = await Promise.all([
                api.get(`/academics/pos/?program_id=${selectedProgram}`),
                api.get(`/academics/psos/?program_id=${selectedProgram}`),
            ]);

            const surveyPayload = {
                survey_name: computedTitle || selectedTool.label,
                survey_category: 'indirect',
                academic_year: selectedYear,
                program_id: selectedProgram,
                activity_type: selectedTool.hasActivity ? activityType : null,
                activity_title: selectedTool.hasActivity ? activityDetail : null,
                conducted_date: selectedTool.hasActivity ? conductedDate : null,
                resource_person_name: selectedTool.hasActivity ? rpName : null,
                resource_person_designation: selectedTool.hasActivity ? rpDesignation : null,
                resource_person_company: selectedTool.hasActivity ? rpCompany : null,
                resource_person_address: selectedTool.hasActivity ? rpAddress : null,
                status: 'APPROVED',
                expires_at: expiry.toISOString(),
                questions: [
                    ...poRes.data.map(po => ({
                        question_text: getSurveyInquiry({ number: po.po_number, description: po.description }, programName),
                        po_id: po.po_id
                    })),
                    ...psoRes.data.map(pso => ({
                        question_text: getSurveyInquiry({ number: pso.pso_number, description: pso.description }, programName),
                        pso_id: pso.pso_id
                    }))
                ]
            };

            const response = await api.post('/surveys/', surveyPayload);
            const backendId = response.data.survey_id;

            const newState = {
                status: 'APPROVED',
                expires_at: expiry.toISOString(),
                duration: String(duration),
                link: buildLink(backendId),
                backendId: backendId
            };
            localStorage.setItem(surveyKey, JSON.stringify(newState));
            setSurveyState(newState);
            alert(`Survey approved and saved to backend! Expires: ${expiry.toLocaleString()}`);
        } catch (err) {
            console.error('Approval failed:', err);
            alert('Failed to approve survey on backend.');
        }
    };

    const handleCopy = () => {
        if (!surveyState?.link) return;
        navigator.clipboard.writeText(surveyState.link);
        alert('Link copied to clipboard!');
    };

    const loadResponses = async (specificBackendId = null) => {
        const id = specificBackendId || surveyState?.backendId;
        if (!id) {
            // Fallback to local storage if no backend ID (legacy)
            const key = `oit_responses_${surveyKey}`;
            const saved = localStorage.getItem(key);
            setResponses(saved ? JSON.parse(saved) : []);
            setFetchedStatements(allStatements);
        } else {
            try {
                const params = {
                    batch_id: selectedBatch,
                    academic_year: selectedYear,
                    class_year: selectedClass,
                    semester: selectedSem,
                    division: selectedDivision
                };
                const res = await api.get(`/surveys/${id}/responses/`, { params });

                // Backend returns { survey, statements, responses }
                const { statements, responses: backendResponses } = res.data;
                const adapted = (backendResponses || []).map(r => ({
                    enrollment: r.enrollment,
                    rollNo: r.roll_no,
                    respondentName: r.respondent_name || r.name,
                    answers: r.answers
                }));
                setResponses(adapted);
                setFetchedStatements(statements || []);
            } catch (err) {
                console.error('Failed to load responses from backend:', err);
                setResponses([]);
                setFetchedStatements([]);
            }
        }
        setShowStats(true);
    };

    const fetchAllActiveSurveys = async () => {
        try {
            const res = await api.get('/surveys/');
            const indirect = (res.data || []).filter(s => s.survey_category === 'indirect' && (s.status === 'APPROVED' || s.status === 'CLOSED'));
            setActiveSurveys(indirect);
            setShowActiveModal(true);
        } catch (err) {
            console.error('Failed to fetch active surveys:', err);
            alert('Failed to load active surveys.');
        }
    };

    const handleCloseFromModal = async (s) => {
        if (!window.confirm('Close this survey early?')) return;
        try {
            await api.patch(`/surveys/${s.survey_id}/`, { status: 'CLOSED' });
            fetchAllActiveSurveys(); // Refresh list
            if (s.survey_id === surveyState?.backendId) {
                setSurveyState(prev => ({ ...prev, status: 'CLOSED' }));
            }
        } catch (err) {
            alert('Failed to close survey');
        }
    };


    // ── Stats table ──────────────────────────────────────────────────────
    const StatsTable = () => {
        const currentStatements = fetchedStatements.length > 0 ? fetchedStatements : allStatements;
        const stats = currentStatements.map(stmt => {
            const vals = responses.map(r => r.answers?.[stmt.id]).filter(v => v !== undefined && v !== null);
            const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
            const countAbove = avg !== null ? vals.filter(v => v >= avg).length : 0;
            const pctAbove = vals.length ? ((countAbove / vals.length) * 100).toFixed(1) : '0.0';
            return { ...stmt, vals, avg: avg !== null ? avg.toFixed(2) : '-', countAbove, pctAbove, attainment: getAttainmentLevel(avg) };
        });

        return (
            <div className="oit-stats-wrapper mt-4 overflow-auto rounded">
                <table className="table table-sm table-bordered oit-stats-table mb-0">
                    <thead>
                        <tr className="align-middle text-center">
                            {isRP ? (
                                <th className="px-3" style={{ minWidth: 180 }}>Name</th>
                            ) : (
                                <>
                                    <th style={{ minWidth: 150 }}>Enrollment No.</th>
                                    <th style={{ minWidth: 80 }}>Roll No.</th>
                                    <th style={{ minWidth: 180 }}>Name</th>
                                </>
                            )}
                            {currentStatements.map(s => (
                                <th key={s.id} className="oit-blue-header" style={{ minWidth: 90 }}>
                                    <div>{s.number}</div>
                                    {s.description && (
                                        <div className="fw-normal text-white-50 mt-1" style={{ fontSize: '.65rem', lineHeight: 1.3, whiteSpace: 'normal', maxWidth: 110 }}>
                                            {getSurveyInquiry(s, programName).split(' ').slice(0, 5).join(' ')}{getSurveyInquiry(s, programName).split(' ').length > 5 ? '…' : ''}
                                        </div>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {responses.length > 0 ? (
                            <>
                                {responses.map((r, i) => (
                                    <tr key={i} className="align-middle">
                                        {isRP ? (
                                            <td className="ps-3 fw-semibold text-muted">{r.respondentName || `Respondent ${i + 1}`}</td>
                                        ) : (
                                            <>
                                                <td className="ps-3 fw-semibold text-muted">{r.enrollment || '—'}</td>
                                                <td className="text-center">{r.rollNo || '—'}</td>
                                                <td>{r.respondentName || '—'}</td>
                                            </>
                                        )}
                                        {currentStatements.map(s => (
                                            <td key={s.id} className="text-center fw-bold">
                                                {r.answers?.[s.id] !== undefined ? r.answers[s.id] : <span className="text-muted opacity-50">-</span>}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                <tr className="oit-summary-row fw-bold border-top-2">
                                    <td colSpan={isRP ? 1 : 3} className="ps-3 text-uppercase small">No. of Respondents</td>
                                    {stats.map(s => <td key={s.id} className="text-center">{s.vals.length}</td>)}
                                </tr>
                                <tr className="oit-summary-row fw-bold">
                                    <td colSpan={isRP ? 1 : 3} className="ps-3 text-uppercase small">Average Rating</td>
                                    {stats.map(s => <td key={s.id} className="text-center text-primary fw-bold">{s.avg}</td>)}
                                </tr>
                                <tr className="oit-summary-row fw-bold">
                                    <td colSpan={isRP ? 1 : 3} className="ps-3 text-uppercase small">% At or Above Average</td>
                                    {stats.map(s => <td key={s.id} className="text-center">{s.pctAbove}%</td>)}
                                </tr>
                                <tr className="oit-attainment-row fw-bold">
                                    <td colSpan={isRP ? 1 : 3} className="ps-3 text-uppercase small text-primary">PO/PSO Attainment Level</td>
                                    {stats.map(s => (
                                        <td key={s.id} className="text-center">
                                            {s.attainment
                                                ? <span className={`attainment-badge al-${s.attainment.level}`}>{s.attainment.level} – {s.attainment.label}</span>
                                                : '-'}
                                        </td>
                                    ))}
                                </tr>
                            </>
                        ) : (
                            <tr>
                                <td colSpan={(isRP ? 1 : 3) + (allStatements.length || 0)} className="text-center py-4 text-muted">
                                    No responses collected yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    const ViewAllModal = () => {
        if (!showActiveModal) return null;
        return (
            <div className="custom-modal-overlay">
                <div className="custom-modal-content p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="mb-0 fw-bold">Active OIT Surveys</h4>
                        <button className="btn-close" onClick={() => setShowActiveModal(false)}></button>
                    </div>
                    <div className="active-surveys-list">
                        {activeSurveys.length > 0 ? (
                            <table className="table table-hover">
                                <thead className="table-light">
                                    <tr>
                                        <th>Survey Details</th>
                                        <th>Expiry</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeSurveys.map(s => {
                                        const fullLink = `${window.location.origin}/student/oit-login?survey=${s.survey_id}&type=${s.activity_type ? 'co-curricular' : 'program-exit'}&program=${s.program_id}&year=${s.academic_year}&activity_type=${s.activity_type || ''}&activity_title=${s.activity_title || ''}`;
                                        return (
                                            <tr key={s.survey_id} className="align-middle">
                                                <td>
                                                    <div className="fw-bold">{s.survey_name}</div>
                                                    <div className="small text-muted">{s.activity_title || s.academic_year}</div>
                                                </td>
                                                <td>{new Date(s.expires_at).toLocaleString()}</td>
                                                <td><span className={`status-badge-compact ${s.status === 'APPROVED' ? 'approved' : 'closed'}`}>{s.status}</span></td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <button className="btn btn-sm btn-outline-primary" onClick={() => { navigator.clipboard.writeText(fullLink); alert('Link copied!'); }}>Link</button>
                                                        <button className="btn btn-sm btn-outline-info" onClick={() => { setShowActiveModal(false); loadResponses(s.survey_id); }}>Stats</button>
                                                        {s.status === 'APPROVED' && <button className="btn btn-sm btn-outline-danger" onClick={() => handleCloseFromModal(s)}>Close</button>}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-center py-4 text-muted">No surveys found.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ── Render ───────────────────────────────────────────────────────────
    return (
        <div className="oit-wrapper">
            <ViewAllModal />
            <div className="oit-main">
                <div className="oit-card">

                    {/* ── Active link bar — clean white, no yellow ── */}
                    {surveyState?.status === 'APPROVED' && (
                        <div className="oit-link-bar mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                    <h5 className="oit-link-title mb-0">{selectedTool.label}</h5>
                                    {computedTitle && <small className="text-muted">{computedTitle}</small>}
                                </div>
                                <span className="badge bg-light text-danger fw-bold border border-danger small">
                                    ⏱ {timeLeft || '…'}
                                </span>
                            </div>
                            <div className="link-input-group">
                                <input
                                    type="text"
                                    className="form-control bg-white font-monospace small"
                                    readOnly
                                    value={surveyState.link}
                                />
                                <button className="btn btn-primary px-4 ms-2" onClick={handleCopy}>
                                    Copy Link
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="filter-row-v2 mb-4 p-3 bg-light rounded border">
                        <div className="row g-3">
                            {/* Department selector removed as it's global */}
                            <div className="col-md">
                                <label className="filter-label">BATCH</label>
                                <select className="form-select filter-select" value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                                    <option value="All">All</option>
                                    {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div className="col-md">
                                <label className="filter-label">ACADEMIC YEAR</label>
                                <select className="form-select filter-select" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                                    <option value="All">All</option>
                                    {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div className="col-md">
                                <label className="filter-label">CLASS</label>
                                <select className="form-select filter-select" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                                    <option value="All">All</option>
                                    {['FY', 'SY', 'TY'].map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div className="col-md" style={{ maxWidth: 80 }}>
                                <label className="filter-label">SEM</label>
                                <select className="form-select filter-select" value={selectedSem} onChange={e => setSelectedSem(e.target.value)}>
                                    {selectedClass === 'All' && <option value="All">All</option>}
                                    {availableSemesters.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="filter-label mb-2">SURVEY TOOL</label>
                        <div className="oit-tool-grid">
                            {SURVEY_TOOLS.map(tool => (
                                <button
                                    key={tool.id}
                                    className={`oit-tool-btn ${selectedTool.id === tool.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedTool(tool);
                                        setActivityDetail('');
                                        setActivityType(ACTIVITY_TYPES[0]);
                                        setRpName('');
                                        setRpDesignation('');
                                        setRpCompany('');
                                        setRpAddress('');
                                        setShowStats(false);
                                    }}
                                >
                                    {tool.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Activity metadata — Co-curricular AND Resource Person */}
                    {selectedTool.hasActivity && (
                        <div className="mt-3 p-3 bg-light rounded border">
                            <label className="filter-label mb-2 d-block">ACTIVITY DETAILS</label>
                            <div className="row g-2">
                                <div className="col-md-4">
                                    <select
                                        className="form-select form-select-sm"
                                        value={activityType}
                                        onChange={e => setActivityType(e.target.value)}
                                    >
                                        {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-8">
                                    {isRP ? (
                                        <select
                                            className="form-select form-select-sm"
                                            onChange={(e) => handleExistingSurveyChange(e.target.value)}
                                            disabled={loadingSurveys}
                                        >
                                            <option value="">-- Select Existing Activity --</option>
                                            {existingSurveys.map(s => (
                                                <option key={s.survey_id} value={s.survey_id}>
                                                    {s.activity_title} ({s.conducted_date || 'No date'})
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="input-group input-group-sm">
                                            <span className="input-group-text oit-type-prefix fw-semibold">
                                                {activityType} —
                                            </span>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder={
                                                    activityType === 'Industry Visit' ? 'company / organisation name'
                                                        : activityType === 'Expert Lecture' ? 'topic (e.g. AI in Healthcare)'
                                                            : 'program name / topic'
                                                }
                                                value={activityDetail}
                                                onChange={e => setActivityDetail(e.target.value)}
                                            />
                                        </div>
                                    )}
                                    {activityDetail && (
                                        <small className="text-success fw-semibold mt-1 d-block">
                                            Title: <em>{computedTitle}</em>
                                        </small>
                                    )}
                                </div>
                            </div>

                            {/* New fields: Date and Resource Person Details */}
                            <div className="row g-2 mt-2">
                                <div className="col-md-4">
                                    <label className="small fw-bold text-muted mb-1">CONDUCTED DATE</label>
                                    <input
                                        type="date"
                                        className="form-control form-control-sm"
                                        value={conductedDate}
                                        onChange={e => setConductedDate(e.target.value)}
                                        readOnly={isRP && activityDetail !== ''}
                                    />
                                </div>

                                {activityType !== 'Industry Visit' && (
                                    <>
                                        <div className="col-md-4">
                                            <label className="small fw-bold text-muted mb-1">RESOURCE PERSON NAME</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Name"
                                                value={rpName}
                                                onChange={e => setRpName(e.target.value)}
                                                readOnly={isRP && activityDetail !== ''}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="small fw-bold text-muted mb-1">DESIGNATION</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Designation"
                                                value={rpDesignation}
                                                onChange={e => setRpDesignation(e.target.value)}
                                                readOnly={isRP && activityDetail !== ''}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="col-md-4">
                                    <label className="small fw-bold text-muted mb-1">COMPANY / ORGANIZATION</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="Company"
                                        value={rpCompany}
                                        onChange={e => setRpCompany(e.target.value)}
                                        readOnly={isRP && activityDetail !== ''}
                                    />
                                </div>

                                <div className="col-md-8">
                                    <label className="small fw-bold text-muted mb-1">ADDRESS</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="Address / Venue"
                                        value={rpAddress}
                                        onChange={e => setRpAddress(e.target.value)}
                                        readOnly={isRP && activityDetail !== ''}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Question-set card ── */}
                    <div className="d-flex justify-content-between align-items-center mb-3 mt-4">
                        <div>
                            <h5 className="fw-bold text-dark mb-0">PO / PSO Question Set</h5>
                            {computedTitle && surveyState?.status === 'APPROVED' && (
                                <small className="text-muted">{computedTitle}</small>
                            )}
                        </div>
                        <span className={`status-badge-compact ${surveyState?.status === 'APPROVED' ? 'approved' : surveyState?.status === 'CLOSED' ? 'closed' : 'draft'}`}>
                            {surveyState?.status === 'APPROVED' ? <FaCheckCircle className="me-1" /> : <FaExclamationCircle className="me-1" />}
                            {surveyState?.status || 'DRAFT'}
                        </span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-1 mt-4">
                        <h5 className="fw-bold text-dark mb-0">Question Sets</h5>
                        <button className="btn btn-sm btn-outline-secondary" onClick={fetchAllActiveSurveys}>
                            View All Active Surveys
                        </button>
                    </div>

                    <div className="oit-qset-card border rounded p-4 shadow-sm bg-white mb-4">
                        {loadingStmts ? (
                            <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
                        ) : allStatements.length === 0 ? (
                            <div className="text-center py-4 text-muted">
                                <FaExclamationCircle size={28} className="mb-2" />
                                <p className="mb-0">No PO / PSO statements found for the selected department.</p>
                                <small>Go to <strong>PEO / PO / PSO → Define</strong> to add statements first.</small>
                            </div>
                        ) : (
                            <>
                                <h6 className="oit-section-label">Program Outcomes (PO)</h6>
                                {pos.map((p, i) => (
                                    <div key={i} className="oit-question-item d-flex gap-3 mb-2">
                                        <span className="oit-qnum">{p.po_number || `PO ${i + 1}`}</span>
                                        <span className="oit-qdesc">{getSurveyInquiry({ number: p.po_number || `PO ${i + 1}`, description: p.description }, programName)}</span>
                                    </div>
                                ))}
                                {psos.length > 0 && (
                                    <>
                                        <h6 className="oit-section-label mt-4">Program Specific Outcomes (PSO)</h6>
                                        {psos.map((p, i) => (
                                            <div key={i} className="oit-question-item d-flex gap-3 mb-2">
                                                <span className="oit-qnum">{p.pso_number || `PSO ${i + 1}`}</span>
                                                <span className="oit-qdesc">{getSurveyInquiry({ number: p.pso_number || `PSO ${i + 1}`, description: p.description }, programName)}</span>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </>
                        )}

                        {/* Action row */}
                        <div className="action-row mt-4 pt-3 border-top d-flex align-items-center gap-3 flex-wrap">
                            {(surveyState?.status === 'APPROVED' || surveyState?.status === 'CLOSED') && (
                                <button
                                    className="btn btn-sm btn-info text-white"
                                    onClick={() => { if (showStats) setShowStats(false); else loadResponses(); }}
                                >
                                    {showStats ? 'Hide Statistics' : 'Show Statistics'}
                                </button>
                            )}
                            <select
                                className="form-select form-select-sm w-auto"
                                value={surveyState?.duration || '7'}
                                onChange={e => setSurveyState(s => ({ ...(s || {}), duration: e.target.value }))}
                                disabled={surveyState?.status === 'APPROVED'}
                            >
                                <option value="3">3 Days</option>
                                <option value="7">7 Days</option>
                                <option value="15">15 Days</option>
                                <option value="30">30 Days</option>
                            </select>
                            <button
                                className={`btn btn-sm px-5 ${surveyState?.status === 'APPROVED' ? 'btn-danger' : 'btn-primary'}`}
                                onClick={handleApprove}
                                disabled={allStatements.length === 0 || !selectedProgram}
                            >
                                {surveyState?.status === 'APPROVED' ? 'Close Early' : 'Approve & Generate Link'}
                            </button>
                        </div>
                    </div>

                    {/* ── Attainment reference ── */}
                    <div className="oit-legend-card border rounded p-3 mb-4">
                        <h6 className="oit-section-label mb-3">PO / PSO Attainment Level Reference  <small className="text-muted fw-normal">(Rating scale: 0 – 3)</small></h6>
                        <div className="d-flex flex-wrap gap-2">
                            {ATTAINMENT_LEVELS.map(al => (
                                <span key={al.level} className={`attainment-badge al-${al.level}`}>
                                    L{al.level} {al.label} (avg {al.min}–{al.max})
                                </span>
                            ))}
                        </div>
                    </div>

                    {showStats && <StatsTable />}
                </div>
            </div>
        </div>
    );
};

export default OtherIndirectTools;
