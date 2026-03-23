import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { FaLock, FaSave, FaPlus, FaReply } from 'react-icons/fa';
import api from '../../../utils/axios';
import { getLoggedInUser } from '../../../utils/auth';
import './ViewRemark.css';

const ViewRemark = () => {
    const user = getLoggedInUser();
    const isUserDisabled = user?.is_active === false;
    const isAuditor = (user?.role_name || user?.role || '').toUpperCase() === 'AUDITOR';
    const isReadOnly = !isAuditor || isUserDisabled;

    const [remarksData, setRemarksData] = useState({ rows: Array(25).fill(0).map(() => Array(10).fill('')) });
    const [loading, setLoading] = useState(true);
    const [periods, setPeriods] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const gridRefs = useRef({});

    const columnLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];

    useEffect(() => {
        fetchPeriods();
    }, []);

    const fetchPeriods = async () => {
        try {
            const res = await api.get('/reports/audit-periods/');
            setPeriods(res.data);
            if (res.data.length > 0) {
                // Default to the active period if exists, else the latest one
                const active = res.data.find(p => p.is_active);
                const defaultPeriod = active || res.data[0];
                setSelectedPeriod(defaultPeriod);
                loadData(defaultPeriod.id);
            } else {
                loadData();
            }
        } catch (err) {
            console.error("Error fetching periods:", err);
            loadData();
        }
    };

    const loadData = async (periodId = null) => {
        setLoading(true);
        try {
            const url = periodId ? `/reports/auditor-board/?period_id=${periodId}` : '/reports/auditor-board/';
            const res = await api.get(url);
            if (res.data.content) {
                setRemarksData(JSON.parse(res.data.content));
            } else {
                setRemarksData({ rows: Array(25).fill(0).map(() => Array(10).fill('')) });
            }
        } catch (err) {
            console.error("Error loading board:", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePeriodChange = (e) => {
        const periodId = e.target.value;
        const period = periods.find(p => p.id === parseInt(periodId));
        setSelectedPeriod(period);
        loadData(periodId);
    };

    const isPeriodReadOnly = !selectedPeriod?.is_active || isReadOnly;

    const handleRowChange = (rowIndex, colIndex, val) => {
        if (isPeriodReadOnly) return;
        const newRows = [...remarksData.rows];
        newRows[rowIndex] = [...newRows[rowIndex]];
        newRows[rowIndex][colIndex] = val;
        setRemarksData({ ...remarksData, rows: newRows });
    };

    const addRow = () => {
        if (isPeriodReadOnly) return;
        const newRows = [...remarksData.rows, Array(remarksData.rows[0].length).fill('')];
        setRemarksData({ ...remarksData, rows: newRows });
    };

    const addColumn = () => {
        if (isPeriodReadOnly) return;
        const newRows = remarksData.rows.map(row => [...row, '']);
        setRemarksData({ ...remarksData, rows: newRows });
    };

    const saveChanges = async () => {
        if (isUserDisabled) {
            alert("Your account is disabled.");
            return;
        }

        if (!selectedPeriod?.is_active) {
            alert("Cannot save to a closed audit period.");
            return;
        }

        try {
            await api.patch('/reports/auditor-board/', {
                content: JSON.stringify(remarksData)
            });

            alert("Board updated successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to update board.");
        }
    };

    const handleKeyDown = (e, rIdx, cIdx) => {
        if (isReadOnly) return;
        const rows = remarksData.rows;
        const maxRows = rows.length;
        const maxCols = rows[0].length;

        let nextR = rIdx;
        let nextC = cIdx;

        if (e.key === 'ArrowUp') {
            nextR = Math.max(0, rIdx - 1);
            e.preventDefault();
        } else if (e.key === 'ArrowDown') {
            nextR = Math.min(maxRows - 1, rIdx + 1);
            e.preventDefault();
        } else if (e.key === 'ArrowLeft') {
            nextC = Math.max(0, cIdx - 1);
            e.preventDefault();
        } else if (e.key === 'ArrowRight') {
            nextC = Math.min(maxCols - 1, cIdx + 1);
            e.preventDefault();
        }

        if (nextR !== rIdx || nextC !== cIdx) {
            const nextRef = gridRefs.current[`${nextR}-${nextC}`];
            if (nextRef) nextRef.focus();
        }
    };

    if (loading) return <div className="text-center py-5">Loading board...</div>;

    return (
        <div className="view-remark-page">
            <Container fluid className="px-4 py-4">
                <div className="view-remark-header d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold text-dark m-0">Remarks Archive</h2>
                        <p className="text-muted small">Select an audit period to view past remarks or edit the current one.</p>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        {periods.length > 0 && (
                            <div className="d-flex align-items-center gap-2">
                                <span className="small fw-bold text-muted">Audit Period:</span>
                                <select 
                                    className="form-select form-select-sm" 
                                    style={{ width: 'auto', minWidth: '200px' }}
                                    value={selectedPeriod?.id || ''}
                                    onChange={handlePeriodChange}
                                >
                                    {periods.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.label} {p.is_active ? '(Active)' : '(Closed)'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {isUserDisabled && (
                            <Badge bg="danger" className="p-2 d-flex align-items-center gap-2">
                                <FaLock /> Account Frozen
                            </Badge>
                        )}
                        {!isAuditor && (
                            <Badge bg="secondary" className="p-2 d-flex align-items-center gap-2">
                                Read-only view
                            </Badge>
                        )}
                        {selectedPeriod && !selectedPeriod.is_active && (
                            <Badge bg="warning" text="dark" className="p-2 d-flex align-items-center gap-2">
                                <FaLock /> Closed Period
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="audit-board-card">
                    <div className="excel-panel-header d-flex justify-content-between align-items-center">
                        <h5 className="fw-bold m-0">Board: {selectedPeriod?.label || 'Remarks'}</h5>
                        {isAuditor && (
                            <div className="d-flex gap-2">
                                <button className="btn btn-sm btn-outline-secondary" onClick={addColumn} title="Add Column" disabled={isPeriodReadOnly}>
                                    <FaPlus size={10} className="me-1" /> Col
                                </button>
                                <button className="btn btn-sm btn-outline-secondary" onClick={addRow} title="Add Row" disabled={isPeriodReadOnly}>
                                    <FaReply size={10} className="me-1" style={{ transform: 'rotate(-90deg)' }} /> Row
                                </button>
                                <button className="btn btn-success btn-sm px-3 fw-bold" onClick={saveChanges} disabled={isPeriodReadOnly}>
                                    <FaSave className="me-2" /> Save
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="excel-grid-container custom-scrollbar p-0">
                        <table className="excel-table">
                            <thead>
                                <tr>
                                    <th className="excel-corner"></th>
                                    {remarksData.rows[0].map((_, idx) => (
                                        <th key={idx} className="excel-col-header">{columnLabels[idx] || `C${idx + 1}`}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {remarksData.rows.map((row, rIdx) => (
                                    <tr key={rIdx}>
                                        <td className="excel-row-header">{rIdx + 1}</td>
                                        {row.map((cell, cIdx) => (
                                            <td key={cIdx} className="excel-cell">
                                                <textarea
                                                    ref={el => gridRefs.current[`${rIdx}-${cIdx}`] = el}
                                                    className="excel-textarea"
                                                    value={cell}
                                                    onChange={(e) => handleRowChange(rIdx, cIdx, e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, rIdx, cIdx)}
                                                    disabled={isPeriodReadOnly}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Container>
        </div>
    );
};

export default ViewRemark;
