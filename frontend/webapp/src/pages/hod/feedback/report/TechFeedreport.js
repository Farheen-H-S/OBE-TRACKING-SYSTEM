import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useFilters } from '../../../../context/FilterContext';
import { getFeedbackSurveys, getFeedbackResponses } from '../../../../services/feedbackService';
import { Button, Spinner, Table, Badge, Modal, Card } from 'react-bootstrap';
import { FaEye, FaDownload, FaSyncAlt } from 'react-icons/fa';

const Techfeedreport = () => {
    const { selectedDept, selectedYear } = useFilters();

    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Preview State
    const [showPreview, setShowPreview] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [selectedSurvey, setSelectedSurvey] = useState(null);
    const [aggregatedData, setAggregatedData] = useState(null);

    const fetchSurveys = useCallback(async () => {
        if (!selectedDept || !selectedYear) return;
        setLoading(true);
        try {
            const res = await getFeedbackSurveys({
                academic_year: selectedYear,
                program_id: selectedDept
            });
            // Sort: Approved first, then by survey_id descending
            const sortedSurveys = (res.data || []).sort((a, b) => {
                if (a.status === 'APPROVED' && b.status !== 'APPROVED') return -1;
                if (a.status !== 'APPROVED' && b.status === 'APPROVED') return 1;
                return b.survey_id - a.survey_id;
            });
            setSurveys(sortedSurveys);
            setError(null);
        } catch (err) {
            console.error("Error fetching feedback surveys:", err);
            setError("Failed to load reports.");
        } finally {
            setLoading(false);
        }
    }, [selectedDept, selectedYear]);

    useEffect(() => {
        fetchSurveys();
    }, [fetchSurveys]);

    const handlePreview = async (survey) => {
        setSelectedSurvey(survey);
        setPreviewLoading(true);
        setShowPreview(true);
        try {
            const res = await getFeedbackResponses(survey.survey_id);
            const { statements, responses } = res.data;

            // Simple aggregation
            const questionStats = statements.map(stmt => {
                const values = responses
                    .map(r => r.answers[stmt.id] || r.answers[String(stmt.question_id)])
                    .filter(v => v !== undefined && v !== null);

                const avg = values.length > 0
                    ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
                    : "N/A";

                return {
                    text: stmt.question_text,
                    avg: avg,
                    count: values.length
                };
            });

            const overallAvg = questionStats
                .filter(q => q.avg !== "N/A")
                .reduce((acc, q, _, arr) => acc + (parseFloat(q.avg) / arr.length), 0)
                .toFixed(2);

            const actualResponders = responses.filter(r => Object.keys(r.answers || {}).length > 0);

            setAggregatedData({
                questionStats,
                overallAvg,
                totalResponses: actualResponders.length
            });
        } catch (err) {
            console.error("Error fetching report data:", err);
            alert("Failed to load preview data.");
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleExport = async (survey) => {
        try {
            const response = await axios.get(`/surveys/${survey.survey_id}/export/`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Feedback_Report_${survey.survey_id}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Export failed", err);
            handleCSVExport(survey); // Fallback
        }
    };

    const handleCSVExport = (survey) => {
        if (!aggregatedData) return;
        const headers = ["Question", "Average Rating", "Response Count"];
        const rows = aggregatedData.questionStats.map(q => [`"${q.text}"`, q.avg, q.count]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Feedback_Report_${survey.survey_id}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    return (
        <div className="flex-grow-1 p-3 bg-light overflow-y-auto">
            <div className="bg-white p-4 rounded shadow-sm" style={{ minHeight: '780px' }}>
                <h2 className="text-center fw-bold mb-4" style={{ fontFamily: 'Inter, sans-serif', color: '#1f2f5c', fontSize: '32px' }}>
                    Teacher Feedback Analysis Reports
                </h2>
                <hr />

                {!selectedDept && (
                    <div className="alert alert-info py-3 border-info text-center">
                        Please select a Department from the top filters to view available reports.
                    </div>
                )}

                <div className="d-flex justify-content-end mb-3">
                    <Button variant="outline-primary" size="sm" onClick={fetchSurveys}>
                        <FaSyncAlt className="me-1" /> Refresh List
                    </Button>
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2 text-muted small">Fetching reports...</p>
                    </div>
                ) : error ? (
                    <div className="alert alert-danger mx-auto text-center" style={{ maxWidth: '600px' }}>
                        {error}
                    </div>
                ) : surveys.length === 0 ? selectedDept && (
                    <div className="text-center py-5">
                        <p className="mt-3 fs-5 text-muted">No feedback surveys found.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <Table hover className="align-middle border">
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-3">ID</th>
                                    <th>Survey Name</th>
                                    <th>Academic Year</th>
                                    <th>Status</th>
                                    <th className="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {surveys.map(s => (
                                    <tr key={s.survey_id}>
                                        <td className="ps-3 fw-bold">#{s.survey_id}</td>
                                        <td className="fw-medium">{s.survey_name}</td>
                                        <td>{s.academic_year}</td>
                                        <td>
                                            <Badge bg={s.status === 'APPROVED' ? 'success' : 'secondary'} className="px-3">
                                                {s.status}
                                            </Badge>
                                        </td>
                                        <td className="text-center">
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                className="fw-bold px-3"
                                                onClick={() => handlePreview(s)}
                                                style={{ borderRadius: '20px' }}
                                            >
                                                <FaEye className="me-1" /> View & Export
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            <Modal show={showPreview} onHide={() => setShowPreview(false)} size="xl" centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        Feedback Report Preview: {selectedSurvey?.survey_name}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ minHeight: '400px' }}>
                    {previewLoading ? (
                        <div className="text-center py-5">
                            <Spinner animation="grow" variant="primary" />
                            <p className="mt-2 text-muted">Analyzing responses...</p>
                        </div>
                    ) : aggregatedData ? (
                        <div className="p-2">
                            <div className="row mb-4">
                                <div className="col-md-4">
                                    <Card className="bg-light border-0 text-center">
                                        <Card.Body>
                                            <small className="text-muted text-uppercase fw-bold">Overall Average Rating</small>
                                            <h2 className="mb-0 text-primary display-4 fw-bold">{aggregatedData.overallAvg}</h2>
                                            <Badge bg={parseFloat(aggregatedData.overallAvg) >= 4 ? 'success' : 'warning'}>
                                                {parseFloat(aggregatedData.overallAvg) >= 4 ? 'EXCELLENT' : 'GOOD'}
                                            </Badge>
                                        </Card.Body>
                                    </Card>
                                </div>
                                <div className="col-md-8">
                                    <div className="d-flex justify-content-around h-100 align-items-center">
                                        <div className="text-center">
                                            <div className="h2 mb-0 fw-bold">{aggregatedData.totalResponses}</div>
                                            <small className="text-muted">Total Responses</small>
                                        </div>
                                        <div className="text-center">
                                            <div className="h2 mb-0 fw-bold">{aggregatedData.questionStats.length}</div>
                                            <small className="text-muted">Questions Analyzed</small>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <h6 className="fw-bold mb-3 border-bottom pb-2">Question Wise Rating Analysis</h6>
                            <Table responsive bordered hover size="sm">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: '40px' }}>#</th>
                                        <th>Feedback Statement</th>
                                        <th className="text-center">Avg Rating (1-5)</th>
                                        <th className="text-center">Responses</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {aggregatedData.questionStats.map((q, i) => (
                                        <tr key={i}>
                                            <td className="text-center">{i + 1}</td>
                                            <td>{q.text}</td>
                                            <td className="text-center fw-bold text-primary">{q.avg}</td>
                                            <td className="text-center">{q.count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            <div className="alert alert-info py-2">
                                <small>* Note: This is an aggregated preview based on 1-5 scale responses.</small>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-5">No response data found for this survey.</div>
                    )}
                </Modal.Body>
                <Modal.Footer className="bg-light">
                    <Button variant="secondary" onClick={() => setShowPreview(false)}>Close</Button>
                    <Button variant="primary" onClick={() => handleExport(selectedSurvey)} disabled={!aggregatedData}>
                        <FaDownload className="me-1" /> Next
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Techfeedreport;
