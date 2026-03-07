import React, { useState, useEffect, useCallback } from 'react';
import { useFilters } from '../../../../context/FilterContext';
import api from '../../../../utils/axios';
import { Button, Spinner, Table, Badge, Card } from 'react-bootstrap';
import { FaFileAlt, FaChevronRight, FaArrowLeft, FaDownload } from 'react-icons/fa';
import './Techfeedreport.css';

const Techfeedreport = () => {
    const { selectedDept, selectedAcademicYear } = useFilters();

    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSurvey, setSelectedSurvey] = useState(null);
    const [reportData, setReportData] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);

    const fetchSurveys = useCallback(async () => {
        if (!selectedDept || !selectedAcademicYear) return;
        setLoading(true);
        try {
            const res = await api.get('/surveys/', {
                params: {
                    survey_category: 'feedback',
                    academic_year: selectedAcademicYear,
                    program_id: selectedDept
                }
            });
            setSurveys(res.data);
        } catch (err) {
            console.error("Error fetching feedback surveys:", err);
        } finally {
            setLoading(false);
        }
    }, [selectedDept, selectedAcademicYear]);

    useEffect(() => {
        fetchSurveys();
    }, [fetchSurveys]);

    const handleViewReport = async (survey) => {
        setSelectedSurvey(survey);
        setLoadingReport(true);
        try {
            const res = await api.get(`/surveys/${survey.survey_id}/responses/`);
            setReportData(res.data);
        } catch (err) {
            console.error("Error fetching report data:", err);
        } finally {
            setLoadingReport(false);
        }
    };

    const handleBack = () => {
        setSelectedSurvey(null);
        setReportData(null);
    };

    if (loading) {
        return (
            <div className="report-container d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <Spinner animation="border" variant="primary" />
                <span className="ms-3 text-primary">Fetching report list...</span>
            </div>
        );
    }

    if (selectedSurvey && reportData) {
        const { statements, responses } = reportData;
        return (
            <div className="report-container">
                <div className="report-content-wrapper">
                    <Card className="report-card shadow-sm border-0">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                                <div className="d-flex align-items-center gap-3">
                                    <Button variant="link" onClick={handleBack} className="p-0 text-dark">
                                        <FaArrowLeft />
                                    </Button>
                                    <h5 className="fw-bold text-dark mb-0">{selectedSurvey.survey_name} Analysis</h5>
                                </div>
                                <Button variant="outline-primary" size="sm">
                                    <FaDownload className="me-1" /> Export CSV
                                </Button>
                            </div>

                            <div className="table-responsive">
                                <Table striped bordered hover className="align-middle small">
                                    <thead className="table-light">
                                        <tr>
                                            <th>#</th>
                                            <th>Student Name</th>
                                            <th>Roll No / Enrollment</th>
                                            {statements.map((s, i) => (
                                                <th key={i} className="text-center" title={s.question_text}>Q{i + 1}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {responses.length > 0 ? (
                                            responses.map((r, i) => (
                                                <tr key={i}>
                                                    <td>{i + 1}</td>
                                                    <td className="fw-bold">{r.name}</td>
                                                    <td>{r.roll_no || r.enrollment}</td>
                                                    {statements.map((s, idx) => (
                                                        <td key={idx} className="text-center fw-bold text-primary">
                                                            {r.answers[s.question_id] || '-'}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3 + statements.length} className="text-center py-4 text-muted">No responses received yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="report-container">
            <div className="report-content-wrapper">
                <div className="report-card">
                    <h2 className="report-title">Teacher Feedback Survey Reports</h2>

                    {!selectedDept && (
                        <div className="alert alert-info py-3 border-info">
                            Please select a Department from the top filters to view available reports.
                        </div>
                    )}

                    <div className="file-list-container">
                        <div className="file-list-header">
                            <span className="ms-2">Report Name</span>
                            <span>Survey Status</span>
                        </div>

                        <ul className="file-list">
                            {surveys.length > 0 ? (
                                surveys.map((survey, index) => (
                                    <li key={index}
                                        className="file-item cursor-pointer d-flex justify-content-between align-items-center"
                                        onClick={() => handleViewReport(survey)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="file-info">
                                            <FaFileAlt className="file-icon text-primary" />
                                            <span className="fw-bold">{survey.survey_name}</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-3">
                                            <Badge bg={survey.status === 'APPROVED' ? 'success' : 'secondary'} className="small px-3">
                                                {survey.status}
                                            </Badge>
                                            <FaChevronRight className="text-muted small" />
                                        </div>
                                    </li>
                                ))
                            ) : selectedDept && (
                                <li className="text-center py-5 text-muted fst-italic">
                                    No reports found for the current selection.
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Techfeedreport;
