import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../utils/axios';
import './OITWelcome.css';
import redbg from '../../../assets/images/redbg.jpg';

const TOOL_LABELS = {
    'co-curricular': 'Co-curricular / Extra Curricular Activity Feedback',
    'resource-person': 'Resource Person Feedback',
    'program-exit': 'Program Exit Survey',
    'alumni': 'Alumni Feedback',
};

const RATING_SCALE = [
    { val: 3, label: 'Fully Achieved' },
    { val: 2, label: 'Mostly Achieved' },
    { val: 1, label: 'Partially Achieved' },
    { val: 0, label: 'Not Achieved' },
];

const OITWelcome = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const survey = searchParams.get('survey') || '';
    const programId = searchParams.get('program') || '';
    const classYear = searchParams.get('class') || '';
    const division = searchParams.get('div') || '';
    const year = searchParams.get('year') || '';
    const type = searchParams.get('type') || '';
    const activityType = searchParams.get('activity_type') || '';
    const activityTitle = searchParams.get('activity_title') || '';

    const [programName, setProgramName] = useState('');
    const [surveyData, setSurveyData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [progRes, survRes] = await Promise.all([
                    api.get('/academics/programs/'),
                    survey ? api.get(`/surveys/${survey}/`) : Promise.resolve({ data: null })
                ]);
                const prog = (progRes.data || []).find(p => String(p.program_id) === String(programId));
                setProgramName(prog?.program_name || 'Program');
                setSurveyData(survRes.data);
            } catch (e) {
                console.error('Fetch error:', e);
                setProgramName('Program');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [programId, survey]);

    const handleStart = () => {
        navigate(`/student/oit-questions?${searchParams.toString()}`);
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-danger" />
            </div>
        );
    }

    const toolLabel = TOOL_LABELS[type] || 'Indirect Survey';
    const isActivity = type === 'co-curricular' || type === 'resource-person';
    const isRP = type === 'resource-person';
    const respondent = JSON.parse(localStorage.getItem('oit_respondent') || '{}');

    return (
        <div className="container-fluid p-0 oitwelcome-container">
            {/* Red header banner — same as Cwelcome */}
            <div className="oitwelcome-header-section d-flex align-items-center mb-0">
                <img src={redbg} alt="Background" className="oitwelcome-bg-img" />
                <h2 className="oitwelcome-title ms-3">
                    Welcome to {toolLabel}
                </h2>
            </div>

            <div className="container py-3">
                <div className="row justify-content-center">
                    <div className="col-lg-10">
                        <div className="card shadow-sm border-0 rounded-4 overflow-hidden oitwelcome-info-card mb-4">
                            <div className="card-body p-4">
                                <div className="row align-items-start">

                                    {/* LEFT — Survey info */}
                                    <div className="col-md-7 border-end pe-md-4">
                                        <div className="mb-4">
                                            <p className="text-danger small fw-bold mb-1 letter-spacing-1">
                                                PROGRAM: {programName?.toUpperCase()}
                                            </p>
                                            <h3 className="fw-bold mb-0 text-dark">{toolLabel}</h3>
                                            <p className="text-muted mb-0">Academic Year: {year}</p>
                                        </div>

                                        <table className="table table-bordered oitwelcome-table mb-0">
                                            <tbody>
                                                <tr>
                                                    <td className="fw-bold text-secondary">Department</td>
                                                    <td className="fw-bold text-dark">{programName}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-bold text-secondary">Batch / Division</td>
                                                    <td className="fw-bold text-dark">{classYear} – Division {division}</td>
                                                </tr>
                                                {(activityType || surveyData?.activity_type) && (
                                                    <tr>
                                                        <td className="fw-bold text-secondary">Activity Type</td>
                                                        <td className="fw-bold text-dark">{surveyData?.activity_type || activityType}</td>
                                                    </tr>
                                                )}
                                                {(activityTitle || surveyData?.activity_title) && (
                                                    <tr>
                                                        <td className="fw-bold text-secondary">
                                                            {isRP ? 'Session / Topic' : 'Activity Title'}
                                                        </td>
                                                        <td className="fw-bold" style={{ color: '#ff3333' }}>
                                                            {surveyData?.activity_title || activityTitle}
                                                        </td>
                                                    </tr>
                                                )}
                                                {isActivity && (surveyData?.conducted_date || surveyData?.resource_person_name) && (
                                                    <>
                                                        {surveyData?.conducted_date && (
                                                            <tr>
                                                                <td className="fw-bold text-secondary">Conducted Date</td>
                                                                <td className="fw-bold text-dark">{surveyData.conducted_date}</td>
                                                            </tr>
                                                        )}
                                                        {surveyData?.resource_person_name && (
                                                            <tr>
                                                                <td className="fw-bold text-secondary">
                                                                    {isRP ? 'Resource Person' : 'Speaker / Expert'}
                                                                </td>
                                                                <td className="fw-bold text-dark">
                                                                    {surveyData.resource_person_name}
                                                                    {surveyData.resource_person_designation && <div className="small text-muted fw-normal">{surveyData.resource_person_designation}</div>}
                                                                    {surveyData.resource_person_company && <div className="small text-muted fw-normal">{surveyData.resource_person_company}</div>}
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </>
                                                )}
                                                {isRP && respondent?.name && !surveyData?.resource_person_name && (
                                                    <tr>
                                                        <td className="fw-bold text-secondary">Resource Person</td>
                                                        <td className="fw-bold text-dark">{respondent.name}</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* RIGHT — Instructions + Rating scale + Start */}
                                    <div className="col-md-5 ps-md-4 d-flex flex-column justify-content-between">
                                        <div>
                                            <p className="small mb-3" style={{ color: '#555', lineHeight: 1.65 }}>
                                                <span style={{ color: '#ff3333' }} className="fw-bold">Instruction: </span>
                                                Read each PO and PSO statement carefully and rate based on your level of achievement or observation.
                                            </p>

                                            <p className="fw-bold mb-2 small text-uppercase" style={{ letterSpacing: '.06em' }}>
                                                Rating Scale:
                                            </p>

                                            <table className="table table-sm table-bordered oitwelcome-rating-table mb-3">
                                                <tbody>
                                                    {RATING_SCALE.map(r => (
                                                        <tr key={r.val}>
                                                            <td className="text-center fw-bold" style={{ width: 40, color: '#ff3333' }}>{r.val}</td>
                                                            <td className="small">{r.label}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="text-end pt-3 mt-auto">
                                            <button
                                                className="btn btn-danger btn-lg px-5 fw-bold oitwelcome-start-btn"
                                                onClick={handleStart}
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

export default OITWelcome;
