import React, { useState, useEffect } from 'react';
import Header from '../../../components/header/Header';
import HodSide from '../../../components/sidebar/HodSide';
import { BsCheckCircleFill, BsXCircleFill, BsEyeFill, BsFileEarmarkExcelFill } from "react-icons/bs";
import api from '../../../utils/axios';
import './ReportVerification.css';
import { Button, Table, Badge, Modal, Form } from 'react-bootstrap';

export default function ReportVerification() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [rejectRemark, setRejectRemark] = useState('');

    useEffect(() => {
        fetchPendingReports();
    }, []);

    const fetchPendingReports = async () => {
        setLoading(true);
        try {
            const res = await api.get('/reports/verification/');
            setReports(res.data);
        } catch (err) {
            console.error("Error fetching reports:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (reportId) => {
        if (!window.confirm("Are you sure you want to approve this report?")) return;
        try {
            await api.post(`/reports/${reportId}/approve/`);
            alert("Report approved successfully!");
            fetchPendingReports();
        } catch (err) {
            console.error("Error approving report:", err);
            alert("Failed to approve report.");
        }
    };

    const handleRejectClick = (report) => {
        setSelectedReport(report);
        setShowRejectModal(true);
    };

    const handleRejectSubmit = async () => {
        if (!rejectRemark.trim()) {
            alert("Please provide a reason for rejection.");
            return;
        }
        try {
            await api.post(`/reports/${selectedReport.report_id}/reject/`, { remark: rejectRemark });
            alert("Report rejected.");
            setShowRejectModal(false);
            setRejectRemark('');
            fetchPendingReports();
        } catch (err) {
            console.error("Error rejecting report:", err);
            alert("Failed to reject report.");
        }
    };

    return (
        <div className="report-verification-wrapper">
            <div className="d-flex">
                <HodSide />
                <div className="report-verification-main">
                    <Header />
                    <div className="report-verification-card m-4 p-4 bg-white shadow-sm rounded">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="report-verification-title m-0">Report Verification</h2>
                            <Button variant="outline-primary" size="sm" onClick={fetchPendingReports}>Refresh</Button>
                        </div>

                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status"></div>
                                <p className="mt-2 text-muted">Loading pending reports...</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <Table bordered hover className="report-verification-table">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Type</th>
                                            <th>Academic Year</th>
                                            <th>Course/Batch</th>
                                            <th>Created At</th>
                                            <th>Created By</th>
                                            <th className="text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reports.length > 0 ? (
                                            reports.map((r) => (
                                                <tr key={r.report_id}>
                                                    <td>
                                                        <Badge bg="info" className="me-2">{r.report_type}</Badge>
                                                    </td>
                                                    <td>{r.year}</td>
                                                    <td>
                                                        {r.report_type === 'Direct' ? (
                                                            <span>Course: {r.course_id}</span>
                                                        ) : (
                                                            <span>Batch ID: {r.batch_id}</span>
                                                        )}
                                                    </td>
                                                    <td>{new Date(r.created_at).toLocaleString()}</td>
                                                    <td>{r.user_id_created || 'System'}</td>
                                                    <td className="text-center">
                                                        <div className="d-flex justify-content-center gap-2">
                                                            <a
                                                                href={r.report_file}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                                                            >
                                                                <BsFileEarmarkExcelFill /> View
                                                            </a>
                                                            <Button
                                                                variant="success"
                                                                size="sm"
                                                                onClick={() => handleApprove(r.report_id)}
                                                                className="d-flex align-items-center gap-1"
                                                            >
                                                                <BsCheckCircleFill /> Approve
                                                            </Button>
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                onClick={() => handleRejectClick(r)}
                                                                className="d-flex align-items-center gap-1"
                                                            >
                                                                <BsXCircleFill /> Reject
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="text-center py-4 text-muted">
                                                    No pending reports found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Reject Report</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Reason for Rejection</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={rejectRemark}
                            onChange={(e) => setRejectRemark(e.target.value)}
                            placeholder="Enter the reason why this report is being rejected..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRejectModal(false)}>Cancel</Button>
                    <Button variant="danger" onClick={handleRejectSubmit}>Reject Report</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
