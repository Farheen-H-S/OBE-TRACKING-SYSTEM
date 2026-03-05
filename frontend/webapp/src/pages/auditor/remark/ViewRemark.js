import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal } from 'react-bootstrap';
import { FaEdit, FaTrash, FaCheckCircle, FaFileAlt, FaCalendarAlt } from 'react-icons/fa';
import './ViewRemark.css';

const ViewRemark = () => {
    const [remarksData, setRemarksData] = useState({});
    const [reports, setReports] = useState([]);
    const [selectedReportId, setSelectedReportId] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({ headers: [], rows: [] });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const storedRemarks = JSON.parse(localStorage.getItem('audit_remarks') || '{}');
        const dacReports = JSON.parse(localStorage.getItem('dac_reports') || '[]');

        // Combine storage-based DAC reports and mock reports for display purposes
        // in a real app, this would be a unified 'Reports' database
        const allReports = [
            ...dacReports.map(r => ({ id: r.id, name: r.name, type: 'DAC Report', date: r.date })),
            { id: 102, name: "Direct CIS Report - CS101", type: "Direct Attainment", date: "20-02-2025" },
            { id: 103, name: "Indirect Attainment - TY Comp", type: "Indirect Attainment", date: "15-02-2025" },
        ];

        setRemarksData(storedRemarks);

        // Filter reports that have remarks
        const reportsWithRemarks = allReports.filter(r => storedRemarks[r.id]);
        setReports(reportsWithRemarks);
    };

    const handleEdit = (reportId) => {
        setSelectedReportId(reportId);
        setEditData(remarksData[reportId]);
        setShowEditModal(true);
    };

    const handleHeaderChange = (idx, val) => {
        const newHeaders = [...editData.headers];
        newHeaders[idx] = val;
        setEditData({ ...editData, headers: newHeaders });
    };

    const handleRowChange = (rowIndex, colIndex, val) => {
        const newRows = [...editData.rows];
        newRows[rowIndex][colIndex] = val;
        setEditData({ ...editData, rows: newRows });
    };

    const saveChanges = () => {
        const updated = { ...remarksData, [selectedReportId]: editData };
        localStorage.setItem('audit_remarks', JSON.stringify(updated));
        setRemarksData(updated);
        setShowEditModal(false);
        alert("Remarks updated successfully!");
    };

    const handleDelete = (reportId) => {
        if (window.confirm("Are you sure you want to delete all remarks for this report?")) {
            const updated = { ...remarksData };
            delete updated[reportId];
            localStorage.setItem('audit_remarks', JSON.stringify(updated));
            setRemarksData(updated);
            setReports(reports.filter(r => r.id !== reportId));
        }
    };

    return (
        <div className="view-remark-page">
            <Container className="py-5">
                <div className="d-flex justify-content-between align-items-center mb-5 border-bottom pb-3">
                    <div>
                        <h2 className="fw-bold text-dark m-0">My Audit Remarks</h2>
                        <p className="text-muted">Review and manage all remarks you've submitted across different reports.</p>
                    </div>
                </div>

                {reports.length > 0 ? (
                    <Row className="g-4">
                        {reports.map((report) => (
                            <Col key={report.id} lg={4} md={6}>
                                <Card className="remark-card h-100 shadow-sm border-0 border-top border-4 border-primary">
                                    <Card.Body className="d-flex flex-column">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <Badge bg="primary-subtle" className="text-primary px-3 py-2">
                                                {report.type}
                                            </Badge>
                                            <div className="text-muted small d-flex align-items-center gap-1">
                                                <FaCalendarAlt /> {report.date.split(',')[0]}
                                            </div>
                                        </div>

                                        <h5 className="fw-bold text-dark mb-3">
                                            <FaFileAlt className="me-2 text-secondary" />
                                            {report.name}
                                        </h5>

                                        <div className="remark-preview mb-4 flex-grow-1">
                                            <p className="text-muted small mb-1">Latest Remark:</p>
                                            <div className="p-2 bg-light rounded italic-text border">
                                                "{remarksData[report.id].rows[0]?.[0] || 'No remarks content.'}"
                                            </div>
                                        </div>

                                        <div className="d-flex gap-2 justify-content-end border-top pt-3 mt-auto">
                                            <Button variant="outline-primary" size="sm" onClick={() => handleEdit(report.id)}>
                                                <FaEdit /> Edit / View Full
                                            </Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(report.id)}>
                                                <FaTrash />
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <div className="text-center py-5 bg-white rounded shadow-sm">
                        {/* <FaCheckCircle className="text-success fs-1 mb-3 opacity-25" /> */}
                        <h4 className="text-muted">No remarks found.</h4>
                        <p className="text-muted">You haven't added any remarks to any reports yet.</p>
                        <Button variant="primary" onClick={() => window.location.href = '/auditor/view-reports'}>
                            Audit a Report
                        </Button>
                    </div>
                )}
            </Container>

            {/* Edit Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold">Edit Remarks: {reports.find(r => r.id === selectedReportId)?.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="table-responsive">
                        <table className="table table-bordered align-middle">
                            <thead className="bg-light">
                                <tr>
                                    {editData.headers.map((h, i) => (
                                        <th key={i}>
                                            <input
                                                className="form-control form-control-sm fw-bold text-center"
                                                value={h}
                                                onChange={(e) => handleHeaderChange(i, e.target.value)}
                                            />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {editData.rows.map((row, rIdx) => (
                                    <tr key={rIdx}>
                                        {row.map((cell, cIdx) => (
                                            <td key={cIdx}>
                                                <textarea
                                                    className="form-control form-control-sm"
                                                    value={cell}
                                                    onChange={(e) => handleRowChange(rIdx, cIdx, e.target.value)}
                                                    rows={2}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={saveChanges}>Save Changes</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ViewRemark;
