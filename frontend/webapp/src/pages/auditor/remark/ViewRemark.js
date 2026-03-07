import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal } from 'react-bootstrap';
import { FaEdit, FaTrash, FaCheckCircle, FaFileAlt, FaCalendarAlt, FaLock } from 'react-icons/fa';
import api from '../../../utils/axios';
import { getLoggedInUser } from '../../../utils/auth';
import './ViewRemark.css';

const ViewRemark = () => {
    const user = getLoggedInUser();
    const isUserDisabled = user?.is_active === false;

    const [remarksData, setRemarksData] = useState({});
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({ rows: [] });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [regularRes, dacRes] = await Promise.all([
                api.get('/reports/'),
                api.get('/reports/dac-reports/')
            ]);

            const allReports = [
                ...regularRes.data.map(r => ({
                    id: r.report_id,
                    name: r.file_name || `Report ${r.report_id}`,
                    type: r.report_type,
                    date: new Date(r.created_at).toLocaleDateString(),
                    auditor_remark: r.auditor_remark,
                    isDac: false,
                    uniqueKey: `reg-${r.report_id}`
                })),
                ...dacRes.data.map(r => ({
                    id: r.dac_report_id,
                    name: r.file_name || `DAC Report ${r.dac_report_id}`,
                    type: 'DAC Report',
                    date: new Date(r.uploaded_at).toLocaleDateString(),
                    auditor_remark: r.auditor_remark,
                    isDac: true,
                    uniqueKey: `dac-${r.dac_report_id}`
                }))
            ];

            const storedRemarks = {};
            const reportsWithRemarks = allReports.filter(r => {
                if (r.auditor_remark) {
                    try {
                        const parsed = JSON.parse(r.auditor_remark);
                        // Only count if it has some non-empty cells
                        const hasContent = parsed.rows?.some(row => row.some(cell => cell && cell.trim() !== ''));
                        if (hasContent) {
                            storedRemarks[r.uniqueKey] = parsed;
                            return true;
                        }
                    } catch (e) {
                        // Old text remark
                        storedRemarks[r.uniqueKey] = { rows: [[r.auditor_remark]] };
                        return true;
                    }
                }
                return false;
            });

            setRemarksData(storedRemarks);
            setReports(reportsWithRemarks);
        } catch (err) {
            console.error("Error loading remarks data:", err);
        }
    };

    const handleEdit = (report) => {
        setSelectedReport(report);
        setEditData(remarksData[report.uniqueKey] || { rows: [[]] });
        setShowEditModal(true);
    };

    const handleRowChange = (rowIndex, colIndex, val) => {
        if (isUserDisabled) return;
        const newRows = [...editData.rows];
        newRows[rowIndex] = [...newRows[rowIndex]];
        newRows[rowIndex][colIndex] = val;
        setEditData({ ...editData, rows: newRows });
    };

    const saveChanges = async () => {
        if (isUserDisabled) {
            alert("Your account is disabled. Remarks cannot be updated.");
            return;
        }

        try {
            const endpoint = selectedReport.isDac
                ? `/reports/dac-reports/${selectedReport.id}/`
                : `/reports/${selectedReport.id}/`;

            await api.patch(endpoint, {
                auditor_remark: JSON.stringify(editData)
            });

            alert("Remarks updated in database successfully!");
            setShowEditModal(false);
            loadData(); // Reload to sync
        } catch (err) {
            console.error(err);
            alert("Failed to update remarks.");
        }
    };

    const handleDelete = async (report) => {
        if (isUserDisabled) return;
        if (window.confirm("Are you sure you want to clear all remarks for this report in the DB?")) {
            try {
                const endpoint = report.isDac
                    ? `/reports/dac-reports/${report.id}/`
                    : `/reports/${report.id}/`;

                await api.patch(endpoint, {
                    auditor_remark: null
                });

                alert("Remarks cleared successfully!");
                loadData();
            } catch (err) {
                console.error(err);
                alert("Failed to clear remarks.");
            }
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
                    {isUserDisabled && (
                        <Badge bg="danger" className="p-2 d-flex align-items-center gap-2">
                            <FaLock /> Auditor Account Frozen
                        </Badge>
                    )}
                </div>

                {reports.length > 0 ? (
                    <Row className="g-4">
                        {reports.map((report) => (
                            <Col key={report.uniqueKey} lg={4} md={6}>
                                <Card className="remark-card h-100 shadow-sm border-0 border-top border-4 border-primary">
                                    <Card.Body className="d-flex flex-column">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <Badge bg="primary-subtle" className="text-primary px-3 py-2">
                                                {report.type}
                                            </Badge>
                                            <div className="text-muted small d-flex align-items-center gap-1">
                                                <FaCalendarAlt /> {report.date}
                                            </div>
                                        </div>

                                        <h5 className="fw-bold text-dark mb-3 text-truncate">
                                            <FaFileAlt className="me-2 text-secondary" />
                                            {report.name}
                                        </h5>

                                        <div className="remark-preview mb-4 flex-grow-1">
                                            <p className="text-muted small mb-1">Snippet:</p>
                                            <div className="p-2 bg-light rounded italic-text border small text-truncate">
                                                "{remarksData[report.uniqueKey]?.rows[0]?.[0] || 'No content.'}"
                                            </div>
                                        </div>

                                        <div className="d-flex gap-2 justify-content-end border-top pt-3 mt-auto">
                                            <Button variant="outline-primary" size="sm" onClick={() => handleEdit(report)}>
                                                <FaEdit /> {isUserDisabled ? 'View Full' : 'Edit / View'}
                                            </Button>
                                            {!isUserDisabled && (
                                                <Button variant="outline-danger" size="sm" onClick={() => handleDelete(report)}>
                                                    <FaTrash />
                                                </Button>
                                            )}
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <div className="text-center py-5 bg-white rounded shadow-sm border">
                        <h4 className="text-muted">No remarks found in database.</h4>
                        <p className="text-muted">You haven't added any remarks to any reports yet.</p>
                        <Button variant="primary" onClick={() => window.location.href = '/auditor'}>
                            Audit a Report
                        </Button>
                    </div>
                )}
            </Container>

            {/* Edit Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold">
                        {isUserDisabled ? 'View' : 'Edit'} Remarks: {selectedReport?.name}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="table-responsive">
                        <table className="table table-bordered align-middle small">
                            <tbody className="bg-light">
                                {editData.rows.map((row, rIdx) => (
                                    <tr key={rIdx}>
                                        <td className="bg-secondary-subtle text-center fw-bold" style={{ width: '40px' }}>{rIdx + 1}</td>
                                        {row.map((cell, cIdx) => (
                                            <td key={cIdx}>
                                                <textarea
                                                    className="form-control form-control-sm border-0 bg-transparent"
                                                    value={cell}
                                                    onChange={(e) => handleRowChange(rIdx, cIdx, e.target.value)}
                                                    rows={1}
                                                    disabled={isUserDisabled}
                                                    style={{ minWidth: '150px' }}
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
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                        {isUserDisabled ? 'Close' : 'Cancel'}
                    </Button>
                    {!isUserDisabled && (
                        <Button variant="primary" onClick={saveChanges}>Save Changes to DB</Button>
                    )}
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ViewRemark;
