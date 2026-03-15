import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../utils/axios';
import './OITQuestion.css';

const RATING_SCALE = [
    { val: 3, label: 'Fully Achieved' },
    { val: 2, label: 'Mostly Achieved' },
    { val: 1, label: 'Partially Achieved' },
    { val: 0, label: 'Not Achieved' },
];

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
    if (key.startsWith('PSO')) {
        const deptPso = PSO_QUESTIONS[programName];
        if (deptPso && deptPso[key]) return deptPso[key];
        return stmt.description || 'No description available.';
    }
    return stmt.description || 'No description available.';
};

const OITQuestion = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const survey = searchParams.get('survey') || '';
    const programId = searchParams.get('program') || '';
    const classYear = searchParams.get('class') || '';
    const division = searchParams.get('div') || '';
    const year = searchParams.get('year') || '';
    const activityType = searchParams.get('activity_type') || '';
    const activityTitle = searchParams.get('activity_title') || '';

    const [statements, setStatements] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [selectedOption, setSelectedOption] = useState(null);
    const [loading, setLoading] = useState(true);
    const [programName, setProgramName] = useState('');

    useEffect(() => { fetchStatements(); }, [programId]);

    const fetchStatements = async () => {
        try {
            // Check if survey is a numeric ID (backend-managed)
            const isBackendSurvey = !isNaN(survey) && survey !== '';

            if (isBackendSurvey) {
                const res = await api.get(`/surveys/${survey}/`);
                if (res.data.program_id) {
                    const pRes = await api.get(`/academics/programs/${res.data.program_id}/`);
                    setProgramName(pRes.data.program_name);
                }
                const backendQuestions = res.data.questions.map(q => ({
                    type: q.po_id ? 'PO' : 'PSO',
                    id: q.question_id,
                    number: q.po_number || q.pso_number,
                    description: q.question_text
                }));
                setStatements(backendQuestions);
            } else {
                // Legacy / fallback: fetch all POS/PSOS
                const [poRes, psoRes, progRes] = await Promise.allSettled([
                    api.get(`/academics/pos/?program_id=${programId}`),
                    api.get(`/academics/psos/?program_id=${programId}`),
                    api.get(`/academics/programs/${programId}/`),
                ]);
                if (progRes.status === 'fulfilled') setProgramName(progRes.value.data.program_name);
                const pos = poRes.status === 'fulfilled' ? (Array.isArray(poRes.value.data) ? poRes.value.data : []) : [];
                const psos = psoRes.status === 'fulfilled' ? (Array.isArray(psoRes.value.data) ? psoRes.value.data : []) : [];
                const combined = [
                    ...pos.map((p, i) => ({ type: 'PO', id: `po_${i}`, number: p.po_number || `PO ${i + 1}`, description: p.description })),
                    ...psos.map((p, i) => ({ type: 'PSO', id: `pso_${i}`, number: p.pso_number || `PSO ${i + 1}`, description: p.description })),
                ];
                setStatements(combined);
            }
        } catch (err) {
            console.error('OITQuestion fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOptionChange = (val) => {
        const stmt = statements[currentIndex];
        setSelectedOption(val);
        setAnswers(prev => ({ ...prev, [stmt.id]: val }));
    };

    const handleNext = async () => {
        if (selectedOption === null || selectedOption === undefined) return;

        if (currentIndex < statements.length - 1) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            const nextId = statements[nextIdx].id;
            setSelectedOption(answers[nextId] !== undefined ? answers[nextId] : null);
        } else {
            // Submit
            try {
                const respondent = JSON.parse(localStorage.getItem('oit_respondent') || '{}');
                const isRP = respondent.type === 'resource-person';

                const response = {
                    respondent: isRP ? respondent.name : respondent.enrollment,
                    respondentName: respondent.respondentName || respondent.name || '',
                    enrollment: respondent.enrollment || '',
                    rollNo: respondent.rollNo || respondent.roll_no || '',
                    type: respondent.type || 'student',
                    survey,
                    program: programId,
                    class: classYear,
                    div: division,
                    year,
                    activityType,
                    activityTitle,
                    answers,
                    submittedAt: new Date().toISOString(),
                };

                // Submit to backend
                const backendPayload = {
                    survey_id: survey,
                    answers: Object.entries(answers).map(([qid, val]) => {
                        const stmt = statements.find(s => String(s.id) === String(qid));
                        return {
                            question_id: !isNaN(qid) ? qid : null,
                            po_number: stmt?.type === 'PO' ? stmt.number : null,
                            pso_number: stmt?.type === 'PSO' ? stmt.number : null,
                            answer_value: val
                        };
                    }),
                    respondent_name: respondent.respondentName || respondent.name,
                    enrollment_no: respondent.enrollment || '',
                    type: respondent.type || 'student'
                };

                await api.post('/surveys/respond/', backendPayload);

                // For backward compatibility/stats view if needed in temporary transition
                const storageKey = `oit_responses_oit_survey_${survey}_${programId}_${year.replace(/\s/g, '')}_${classYear}_${division}`;
                const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
                const deduped = existing.filter(r => r.respondent !== response.respondent);
                deduped.push(response);
                localStorage.setItem(storageKey, JSON.stringify(deduped));

                navigate('/student/thank-you');
            } catch (err) {
                console.error('Submission error:', err);
                const errorMsg = err.response?.data?.error || 'Failed to submit. Please try again.';
                alert(errorMsg);
            }
        }
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            const prevIdx = currentIndex - 1;
            setCurrentIndex(prevIdx);
            const prevId = statements[prevIdx].id;
            setSelectedOption(answers[prevId] !== undefined ? answers[prevId] : null);
        }
    };

    if (loading) {
        return <div className="text-center py-5"><div className="spinner-border text-danger" /></div>;
    }

    if (statements.length === 0) {
        return (
            <div className="container py-5 text-center">
                <h4 className="text-muted">No PO / PSO statements found for this program.</h4>
                <button className="btn btn-danger mt-3" onClick={() => navigate(-1)}>Go Back</button>
            </div>
        );
    }

    const current = statements[currentIndex];
    const isLast = currentIndex === statements.length - 1;
    const isFirst = currentIndex === 0;
    const poCount = statements.filter(s => s.type === 'PO').length;
    const section = current.type === 'PO' ? 'Program Outcome' : 'Program Specific Outcome';

    return (
        <div className="container-fluid oitq-container d-flex flex-column align-items-center justify-content-start pt-5">
            <div className="oitq-content w-100" style={{ maxWidth: 600 }}>

                {/* Section label */}
                <p className="oitq-section-label text-center mb-1">
                    {section} — {current.type === 'PO'
                        ? `${currentIndex + 1} of ${poCount}`
                        : `${currentIndex - poCount + 1} of ${statements.length - poCount}`}
                </p>

                {/* PO/PSO number — red like CO number */}
                <h2 className="text-center oitq-title mb-5">{current.number}</h2>

                {/* Statement text */}
                <p className="oitq-question mb-4 fw-semibold text-dark fs-5">
                    {getSurveyInquiry(current, programName)}
                </p>

                {/* Rating options — same pill style as Co1 */}
                <div className="oitq-options mb-5 ps-1">
                    {RATING_SCALE.map(item => (
                        <label
                            key={item.val}
                            className="form-check mb-4 p-3 border rounded-3 radio-option-pill d-flex align-items-center oitq-option-label"
                            htmlFor={`oit-option-${item.val}`}
                        >
                            <input
                                className="form-check-input oitq-radio-input ms-0 mt-0"
                                type="radio"
                                name="oit-survey-options"
                                id={`oit-option-${item.val}`}
                                checked={selectedOption === item.val}
                                onChange={() => handleOptionChange(item.val)}
                            />
                            <div className="ms-3 d-flex align-items-center">
                                <span className="fw-bold me-2 fs-5">{item.val}</span>
                                <span className="text-muted small">({item.label})</span>
                            </div>
                        </label>
                    ))}
                </div>

                {/* Navigation */}
                <div className="d-flex justify-content-between align-items-center">
                    <button
                        className="btn btn-outline-secondary px-4"
                        onClick={handleBack}
                        disabled={isFirst}
                    >
                        ← Back
                    </button>
                    <p className="text-center text-muted small mb-0">
                        Question {currentIndex + 1} of {statements.length}
                    </p>
                    <button
                        className={`btn btn-danger btn-lg px-5 fw-bold oitq-btn ${selectedOption === null || selectedOption === undefined ? 'opacity-50' : ''}`}
                        onClick={handleNext}
                        disabled={selectedOption === null || selectedOption === undefined}
                    >
                        {isLast ? 'SUBMIT' : 'NEXT'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OITQuestion;
