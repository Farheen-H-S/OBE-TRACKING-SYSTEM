import React, { useState, useEffect } from 'react';
import './Reportverify.css';
import api from '../../../utils/axios';
import { getLoggedInUser } from '../../../utils/auth';

const Reportverifiy = () => {
    const user = getLoggedInUser();
    const isFaculty = user?.role?.toLowerCase() === 'faculty';
    const [reports, setReports] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');

    // Sync with global filters from localStorage or use defaults
    const [selectedYear, setSelectedYear] = useState(localStorage.getItem('selectedAcademicYear') || '2025 - 26');
    const [selectedBatch, setSelectedBatch] = useState(localStorage.getItem('selectedBatch') || '2025 - 26');
    const [selectedClass, setSelectedClass] = useState(localStorage.getItem('selectedClassYear') || '');
    const [selectedSem, setSelectedSem] = useState(localStorage.getItem('selectedSemester') || '');

    const years = [];
    for (let i = 2019; i <= 2030; i++) {
        years.push(`${i} - ${(i + 1).toString().slice(-2)}`);
    }
    const classes = ['FY', 'SY', 'TY'];
    const semesters = ['1', '2', '3', '4', '5', '6'];

    useEffect(() => {
        fetchPendingReports();
        // Listener for storage changes if filters are updated in header
        const handleStorageChange = () => {
            setSelectedYear(localStorage.getItem('selectedAcademicYear') || '2025 - 26');
            setSelectedBatch(localStorage.getItem('selectedBatch') || '2025 - 26');
            setSelectedClass(localStorage.getItem('selectedClassYear') || '');
            setSelectedSem(localStorage.getItem('selectedSemester') || '');
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const fetchPendingReports = async () => {
        try {
            const [regularRes, dacRes] = await Promise.all([
                api.get('/reports/verification/'),
                api.get('/reports/dac-reports/')
            ]);

            const regularReports = regularRes.data.map(r => ({
                ...r,
                report_id: r.report_id,
                report_name: r.file_name || `${r.report_type} Report - ${r.course_id || r.batch_id || 'N/A'}`,
                display_status: r.status,
                submitted_by: r.user_id_created || 'System'
            }));

            const dacReports = dacRes.data.map(r => ({
                ...r,
                report_id: r.dac_report_id,
                report_type: 'DAC Report',
                report_name: r.file_name || `DAC Report - ${r.academic_year} (${r.semester})`,
                report_file: r.file,
                created_at: r.created_at,
                display_status: r.status,
                submitted_by: r.uploaded_by || 'System',
                // Map filters for consistent filtering logic
                filters: {
                    academicYear: r.academic_year,
                    batch: r.batch,
                    class: r.class_year,
                    semester: r.semester
                }
            }));

            setReports([...regularReports, ...dacReports]);
        } catch (err) {
            console.error("Error fetching reports:", err);
        }
    };

    const handleAction = async (report, newStatus) => {
        const id = report.report_id;
        const isDac = report.report_type === 'DAC Report';
        try {
            if (newStatus === 'Approved') {
                const endpoint = isDac ? `/reports/dac-reports/${id}/approve/` : `/reports/${id}/approve/`;
                await api.post(endpoint);
                alert("Report approved successfully!");
            } else if (newStatus === 'Rejected') {
                const remark = window.prompt("Enter reason for rejection:");
                if (remark === null) return;
                const endpoint = isDac ? `/reports/dac-reports/${id}/reject/` : `/reports/${id}/reject/`;
                await api.post(endpoint, { remark });
                alert("Report rejected.");
            }
            fetchPendingReports();
        } catch (err) {
            console.error(`Error updating report status:`, err);
            alert(`Failed to update report status.`);
        }
    };

    const filteredReports = reports.filter(r => {
        const typeMatchName = r.report_type ? String(r.report_type).toLowerCase() : '';
        const userMatchName = r.submitted_by ? String(r.submitted_by).toLowerCase() : '';
        const searchLow = searchTerm.toLowerCase();

        const matchesSearch = typeMatchName.includes(searchLow) ||
            userMatchName.includes(searchLow) ||
            (r.course_id && r.course_id.toString().toLowerCase().includes(searchLow));

        const matchesType = filterType === 'All' || r.report_type === filterType || (r.report_type === 'Batch' && filterType === 'PO/PSO Attainment');

        // Context filtering
        const matchesYear = !selectedYear || !r.filters?.academicYear || r.filters.academicYear === selectedYear;
        const matchesBatch = !selectedBatch || !r.filters?.batch || r.filters.batch === selectedBatch;
        const matchesClass = !selectedClass || !r.filters?.class || r.filters.class === selectedClass;
        const matchesSem = !selectedSem || !r.filters?.semester || String(r.filters.semester) === String(selectedSem);

        return matchesSearch && matchesType && matchesYear && matchesBatch && matchesClass && matchesSem;
    });

    return (
        <div className="reportverifiy-wrapper">
            <div className="reportverifiy-main">
                <div className="reportverifiy-card">
                    <h2 className="rv-title">Report Verification & Approval</h2>

                    <div className="filter-row-v2 mb-4 p-3 bg-light rounded border">
                        <div className="row g-3">
                            <div className="col-md">
                                <label className="filter-label">TYPE</label>
                                <select
                                    className="form-select filter-select"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                >
                                    <option value="All">All Types</option>
                                    <option value="DAC Report">DAC Reports</option>
                                    <option value="Direct">Direct Attainment</option>
                                    <option value="Indirect">Indirect Attainment</option>
                                    <option value="Batch">PO/PSO Attainment</option>
                                </select>
                            </div>
                            <div className="col-md">
                                <div className="search-box position-relative" style={{ marginTop: '24px' }}>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rv-table-container">
                        <table className="rv-table">
                            <thead>
                                <tr>
                                    <th>Report ID</th>
                                    <th>Report Name</th>
                                    <th>Type</th>
                                    <th>Submission Date</th>
                                    <th>Submitted By</th>
                                    <th className="text-center">View</th>
                                    <th className="text-center">Remarks</th>
                                    <th className="text-center">Status</th>
                                    {!isFaculty && <th className="text-center">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReports.length > 0 ? (
                                    filteredReports.map((report) => (
                                        <tr key={`${report.report_type}-${report.report_id}`}>
                                            <td>{report.report_id}</td>
                                            <td className="text-start fw-bold">
                                                {report.report_name}
                                            </td>
                                            <td className="small">{report.report_type}</td>
                                            <td className="small">{new Date(report.created_at).toLocaleString()}</td>
                                            <td>{report.submitted_by}</td>
                                            <td>
                                                <div className="d-flex justify-content-center">
                                                    <a
                                                        href={report.report_file}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="btn btn-view btn-sm"
                                                        title="View Report"
                                                    >
                                                        View
                                                    </a>
                                                </div>
                                            </td>
                                            <td className="text-center small text-muted">
                                                {report.auditor_remark || '-'}
                                            </td>
                                            <td className="text-center">
                                                <span className={`status-badge status-${(report.display_status || '').toLowerCase()}`}>
                                                    {report.display_status}
                                                </span>
                                            </td>
                                            {!isFaculty && (
                                                <td>
                                                    <div className="d-flex gap-2 justify-content-center">
                                                        <button
                                                            className={`btn btn-success btn-sm btn-action ${(report.display_status === 'Approved' || report.display_status === 'Verified') ? 'disabled' : ''}`}
                                                            title="Approve"
                                                            onClick={() => handleAction(report, 'Approved')}
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            className={`btn btn-danger btn-sm btn-action ${report.display_status === 'Rejected' ? 'disabled' : ''}`}
                                                            title="Reject"
                                                            onClick={() => handleAction(report, 'Rejected')}
                                                        >
                                                            ✗
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-muted">No reports found matching your criteria.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reportverifiy;
