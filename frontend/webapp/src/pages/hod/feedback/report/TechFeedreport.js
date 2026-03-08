import { Chart as GoogleChart } from "react-google-charts";
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useFilters } from '../../../../context/FilterContext';
import { getFeedbackSurveys, getFeedbackResponses } from '../../../../services/feedbackService';
import { Button, Spinner, Table, Badge, Modal, Card } from 'react-bootstrap';
import { FaEye, FaDownload, FaSyncAlt } from 'react-icons/fa';
import api from '../../../../utils/axios';

const TechFeedreport = () => {
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
            const { statements, teachers, total_responses } = res.data;

            setAggregatedData({
                statements,
                teachers,
                total_responses
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
            const response = await api.get(`/surveys/${survey.survey_id}/export/`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Feedback_Report_${survey.survey_name.replace(/\s+/g, '_')}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Export failed", err);
            alert("Export failed. Falling back to CSV.");
            handleCSVExport(survey); // Fallback
        }
    };

    const handleCSVExport = (survey) => {
        if (!aggregatedData) return;
        const headers = ["Teacher Name", "Achieved Score"];
        const rows = aggregatedData.teachers.map(t => [`"${t.teacher}"`, t.achieved_score]);
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
                <h2 className="text-center fw-bold mb-4" style={{ fontFamily: 'Inter, sans-serif', color: '#445D99', fontSize: '32px' }}>
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
                                            <Badge bg={s.status === 'APPROVED' ? 'success' : (s.status === 'CLOSED' ? 'danger' : 'secondary')} className="px-3">
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
                                                <FaEye className="me-1" /> View Analysis
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
            <Modal show={showPreview} onHide={() => setShowPreview(false)} size="xl" centered scrollable>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title className="fw-bold">
                        Feedback Analysis Preview: {selectedSurvey?.survey_name}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ minHeight: '600px', backgroundColor: '#f8f9fa' }}>
                    {previewLoading ? (
                        <div className="text-center py-5">
                            <Spinner animation="grow" variant="primary" />
                            <p className="mt-2 text-muted">Generating matrix analysis...</p>
                        </div>
                    ) : aggregatedData ? (
                        <div className="p-2">
                            <div className="row g-4 mb-4">
                                <div className="col-md-4">
                                    <Card className="border-0 shadow-sm text-center h-100">
                                        <Card.Body className="d-flex flex-column justify-content-center">
                                            <small className="text-muted text-uppercase fw-bold mb-2 d-block">Total Responses</small>
                                            <h1 className="mb-0 text-primary display-3 fw-bold">{aggregatedData.total_responses}</h1>
                                            <p className="text-muted mt-2 mb-0">Total students participated</p>
                                        </Card.Body>
                                    </Card>
                                </div>
                                <div className="col-md-8">
                                    <Card className="border-0 shadow-sm h-100 p-3">
                                        <div style={{ height: '300px' }}>
                                            <GoogleChart
                                                chartType="BarChart"
                                                width="100%"
                                                height="300px"
                                                data={[
                                                    ["Teacher", "Achieved Score"],
                                                    ...aggregatedData.teachers.map(t => [t.teacher, t.achieved_score])
                                                ]}
                                                options={{
                                                    title: "Teacher Feedback Performance",
                                                    chartArea: { width: "60%" },
                                                    hAxis: {
                                                        title: "Achieved Score (1-5)",
                                                        minValue: 0,
                                                        maxValue: 5
                                                    },
                                                    vAxis: {
                                                        title: "Teachers",
                                                    },
                                                    colors: ['#445D99'],
                                                    legend: { position: 'none' }
                                                }}
                                            />
                                        </div>
                                    </Card>
                                </div>
                            </div>

                            <Card className="border-0 shadow-sm mt-4">
                                <Card.Header className="bg-white border-bottom py-3">
                                    <h5 className="mb-0 fw-bold">Teacher-wise Performance Summary</h5>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    <div className="table-responsive">
                                        <Table hover className="mb-0">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th className="ps-4" style={{ width: '80px' }}>Rank</th>
                                                    <th>Teacher Name</th>
                                                    <th className="text-center">Achieved Score (1-5)</th>
                                                    <th className="text-center" style={{ width: '200px' }}>Performance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {aggregatedData.teachers.map((t, i) => (
                                                    <tr key={i}>
                                                        <td className="ps-4 fw-bold text-muted">#{i + 1}</td>
                                                        <td className="fw-semibold">{t.teacher}</td>
                                                        <td className="text-center fw-bold text-primary fs-5">{t.achieved_score}</td>
                                                        <td className="text-center">
                                                            <Badge bg={t.achieved_score >= 4.5 ? 'success' : (t.achieved_score >= 3.5 ? 'primary' : 'warning')}>
                                                                {t.achieved_score >= 4.5 ? 'EXCELLENT' : (t.achieved_score >= 3.5 ? 'VERY GOOD' : 'GOOD')}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                </Card.Body>
                            </Card>

                            <div className="alert alert-light border mt-4 small text-muted">
                                <i className="bi bi-info-circle me-2"></i>
                                Analysis is calculated by aggregating responses for each teacher across all survey statements.
                                Teachers are sorted by their average performance score.
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-5">No response data found for this survey.</div>
                    )}
                </Modal.Body>
                <Modal.Footer className="bg-light">
                    <Button variant="outline-secondary" onClick={() => setShowPreview(false)}>Close</Button>
                    <Button
                        variant="primary"
                        onClick={() => handleExport(selectedSurvey)}
                        disabled={!aggregatedData || aggregatedData.total_responses === 0}
                        className="px-4 fw-bold"
                    >
                        <FaDownload className="me-2" /> Download Detailed Excel (.xlsx)
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default TechFeedreport;
