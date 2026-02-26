import React, { useState, useEffect } from 'react';
import Header from '../../../components/header/Header';
import HodSide from '../../../components/sidebar/HodSide';
import api from '../../../utils/axios';
import './ActivityLog.css';
import { Table, Form, InputGroup } from 'react-bootstrap';
import { BsSearch, BsFilter } from "react-icons/bs";

export default function ActivityLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        date: '',
        module: ''
    });

    useEffect(() => {
        fetchLogs();
    }, [filters]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/audit/logs/', { params: filters });
            // The API returns paginated data: { count, next, previous, results }
            setLogs(res.data.results || []);
        } catch (err) {
            console.error("Error fetching logs:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const filteredLogs = logs.filter(log =>
        log.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.remark && log.remark.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="activity-log-wrapper">
            <div className="d-flex">
                <HodSide />
                <div className="activity-log-main">
                    <Header />
                    <div className="activity-log-card m-4 p-4 bg-white shadow-sm rounded">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="activity-log-title m-0">System Activity Log</h2>
                        </div>

                        <div className="filters-row mb-4 row g-3">
                            <div className="col-md-4">
                                <InputGroup size="sm">
                                    <InputGroup.Text><BsSearch /></InputGroup.Text>
                                    <Form.Control
                                        placeholder="Search logs..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </InputGroup>
                            </div>
                            <div className="col-md-3">
                                <Form.Control
                                    size="sm"
                                    type="date"
                                    name="date"
                                    value={filters.date}
                                    onChange={handleFilterChange}
                                />
                            </div>
                            <div className="col-md-3">
                                <Form.Select
                                    size="sm"
                                    name="module"
                                    value={filters.module}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All Modules</option>
                                    <option value="Course">Course</option>
                                    <option value="Report">Report</option>
                                    <option value="Survey">Survey</option>
                                    <option value="Batch">Batch</option>
                                </Form.Select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status"></div>
                                <p className="mt-2 text-muted">Loading logs...</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <Table bordered hover className="activity-log-table">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Time</th>
                                            <th>User</th>
                                            <th>Action</th>
                                            <th>Module</th>
                                            <th>ID</th>
                                            <th>Remark</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLogs.length > 0 ? (
                                            filteredLogs.map((log) => (
                                                <tr key={log.log_id}>
                                                    <td className="small">{new Date(log.created_at).toLocaleString()}</td>
                                                    <td>{log.user_id || 'System'}</td>
                                                    <td>
                                                        <span className={`badge ${getActionBadgeClass(log.action)}`}>
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td>{log.entity_name}</td>
                                                    <td>{log.entity_id}</td>
                                                    <td className="small">{log.remark}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="text-center py-4 text-muted">
                                                    No activity logs found.
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
        </div>
    );
}

function getActionBadgeClass(action) {
    switch (action) {
        case 'CREATE': return 'bg-success';
        case 'UPDATE': return 'bg-info';
        case 'DISABLE': return 'bg-warning';
        case 'APPROVE': return 'bg-primary';
        case 'CALCULATE': return 'bg-secondary';
        case 'DELETE': return 'bg-danger';
        default: return 'bg-dark';
    }
}
