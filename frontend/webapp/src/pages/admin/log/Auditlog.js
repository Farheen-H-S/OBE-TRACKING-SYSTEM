import React, { useState, useEffect } from 'react';
import api from '../../../utils/axios';
import './Auditlog.css';

const Auditlog = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [inputPage, setInputPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize] = useState(20);
    const [selectedLog, setSelectedLog] = useState(null);

    useEffect(() => {
        fetchLogs();
        setInputPage(page);
    }, [page]);

    // Use a separate useEffect for debouncing the input page
    useEffect(() => {
        const timer = setTimeout(() => {
            const p = parseInt(inputPage);
            if (!isNaN(p) && p >= 1 && p <= totalPages && p !== page) {
                setPage(p);
            }
        }, 800); // 800ms debounce

        return () => clearTimeout(timer);
    }, [inputPage, totalPages, page]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/audit/logs/?page=${page}&page_size=${pageSize}`);
            setRows(response.data.results);
            setTotalPages(Math.ceil(response.data.count / pageSize));
        } catch (error) {
            console.error("Error fetching audit logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).replace(',', '');
    };

    const handlePageInputChange = (e) => {
        const val = e.target.value;
        // Allow empty string so user can delete and type
        if (val === '') {
            setInputPage('');
            return;
        }
        const p = parseInt(val);
        if (!isNaN(p)) {
            setInputPage(p);
        }
    };

    return (
        <div className="audit-log-container">
            <div className="flex-grow-1 p-5 bg-white overflow-y-auto" style={{ backgroundColor: '#fff' }}>
                <h2 className="mb-4 text-primary fw-bold" style={{ color: '#2c3e50' }}>System Access & Activity Log</h2>

                <div className="table-wrapper">
                    <table className="table table-bordered audit-table mb-0">
                        <thead className="table-light">
                            <tr>
                                <th style={{ width: '10%' }}>Record ID</th>
                                <th style={{ width: '15%' }}>Date & time</th>
                                <th style={{ width: '15%' }}>Username</th>
                                <th style={{ width: '10%' }}>Role</th>
                                <th style={{ width: '15%' }}>Action</th>
                                <th style={{ width: '35%' }}>Short Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-4">
                                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                                        Loading logs...
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-4">No audit logs found.</td>
                                </tr>
                            ) : (
                                rows.map((row) => (
                                    <tr key={row.log_id}>
                                        <td className="text-center">LOG-{row.log_id}</td>
                                        <td className="text-center">{formatDate(row.created_at)}</td>
                                        <td>{row.username || 'System'}</td>
                                        <td className="text-center">{row.role_name || '-'}</td>
                                        <td className="text-center fw-semibold">{row.action}</td>
                                        <td className="d-flex align-items-center justify-content-between border-0">
                                            <span className="text-truncate me-2" style={{ maxWidth: '300px' }}>
                                                {row.action} on {row.entity_name} (ID: {row.entity_id}) {row.remark ? `- ${row.remark}` : ''}
                                            </span>
                                            <button
                                                className="btn btn-sm btn-outline-primary view-details-btn text-nowrap fw-bold shadow-sm"
                                                style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                                                onClick={() => setSelectedLog(row)}
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="d-flex justify-content-center align-items-center mt-4 gap-3">
                        <button
                            className="btn btn-outline-primary shadow-sm px-3"
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            style={{ borderRadius: '8px' }}
                        >
                            Previous
                        </button>

                        <div className="d-flex align-items-center gap-2 pagination-input-wrapper">
                            <span>Page</span>
                            <input
                                type="number"
                                className="form-control text-center shadow-sm"
                                value={inputPage}
                                onChange={handlePageInputChange}
                                min="1"
                                max={totalPages}
                                style={{ width: '70px', borderRadius: '8px', border: '1px solid #dee2e6' }}
                            />
                            <span>of {totalPages}</span>
                        </div>

                        <button
                            className="btn btn-outline-primary shadow-sm px-3"
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                            style={{ borderRadius: '8px' }}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Log Details Modal */}
            {selectedLog && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
                    <div className="bg-white p-4 rounded shadow-lg" style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h4 className="fw-bold m-0">Log Details (LOG-{selectedLog.log_id})</h4>
                            <button className="btn-close" onClick={() => setSelectedLog(null)}></button>
                        </div>
                        <div className="row g-3">
                            <div className="col-md-6"><p><strong>Entity:</strong> {selectedLog.entity_name} (ID: {selectedLog.entity_id})</p></div>
                            <div className="col-md-6"><p><strong>Action:</strong> {selectedLog.action}</p></div>
                            <div className="col-md-6"><p><strong>User:</strong> {selectedLog.username}</p></div>
                            <div className="col-md-6"><p><strong>Time:</strong> {formatDate(selectedLog.created_at)}</p></div>
                            <div className="col-12"><p><strong>Remark:</strong> {selectedLog.remark || 'N/A'}</p></div>
                            <div className="col-12"><p><strong>IP Address:</strong> {selectedLog.ip_address || 'N/A'}</p></div>

                            {(() => {
                                const oldVal = selectedLog.old_value || {};
                                const newVal = selectedLog.new_value || {};
                                const allKeys = Array.from(new Set([...Object.keys(oldVal), ...Object.keys(newVal)]));
                                const changedKeys = allKeys.filter(key => {
                                    if (['updated_at', 'created_at', 'password', 'profile_picture'].includes(key)) return false;
                                    return JSON.stringify(oldVal[key]) !== JSON.stringify(newVal[key]);
                                });

                                return (
                                    <>
                                        <div className="col-md-6">
                                            <p className="fw-bold mb-1">Old Values:</p>
                                            <div className="bg-light p-3 rounded" style={{ fontSize: '0.85rem', maxHeight: '300px', overflowY: 'auto' }}>
                                                {changedKeys.length > 0 ? (
                                                    changedKeys.map(key => (
                                                        <div key={key} className="mb-1 text-danger fw-bold">
                                                            {key}: {JSON.stringify(oldVal[key]) || 'null'}
                                                        </div>
                                                    ))
                                                ) : <span className="text-muted italic">No data fields were modified.</span>}
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <p className="fw-bold mb-1">New Values:</p>
                                            <div className="bg-light p-3 rounded" style={{ fontSize: '0.85rem', maxHeight: '300px', overflowY: 'auto' }}>
                                                {changedKeys.length > 0 ? (
                                                    changedKeys.map(key => (
                                                        <div key={key} className="mb-1 text-success fw-bold">
                                                            {key}: {JSON.stringify(newVal[key]) || 'null'}
                                                        </div>
                                                    ))
                                                ) : <span className="text-muted italic">No data fields were modified.</span>}
                                            </div>
                                        </div>
                                        {changedKeys.length > 0 && (
                                            <div className="col-12 mt-2">
                                                <div className="alert alert-info py-2 small mb-0">
                                                    <strong>Changed fields:</strong> {changedKeys.join(', ')}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                        <div className="mt-4 text-center">
                            <button className="btn btn-outline-primary px-4 shadow-sm fw-bold" onClick={() => setSelectedLog(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Auditlog;

