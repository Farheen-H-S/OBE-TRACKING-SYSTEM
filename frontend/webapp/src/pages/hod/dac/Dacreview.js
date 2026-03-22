import React, { useState, useEffect } from 'react';
import './Dacreview.css';
import { FaFilePdf, FaFileExcel, FaUpload, FaTrash, FaDownload, FaExclamationCircle } from 'react-icons/fa';
import api from '../../../utils/axios';
import { getLoggedInUser } from '../../../utils/auth';
import { useFilters } from '../../../context/FilterContext';

const Dacreview = () => {
    const user = getLoggedInUser();
    const [reports, setReports] = useState([]);
    const {
        departments,
        years,
        selectedDept, setSelectedDept,
        selectedBatch, setSelectedBatch,
        selectedYear, setSelectedYear,
        selectedClass, setSelectedClass,
        selectedSemester, setSelectedSemester,
        validateContext
    } = useFilters();

    const requiredFields = ['dept', 'batch', 'year', 'class', 'semester'];
    const { isValid, missingFields } = validateContext(requiredFields);

    const [loading, setLoading] = useState(false);
    const classes = ['FY', 'SY', 'TY'];

    // Smart semester filtering
    const getAvailableSemesters = (cls) => {
        switch (cls) {
            case 'FY': return ['1', '2'];
            case 'SY': return ['3', '4'];
            case 'TY': return ['5', '6'];
            default: return ['1', '2', '3', '4', '5', '6'];
        }
    };

    const availableSemesters = getAvailableSemesters(selectedClass);



    useEffect(() => {
        loadReports();
    }, [selectedDept, selectedBatch, selectedYear, selectedClass, selectedSemester]);

    const loadReports = async () => {
        setLoading(true);
        try {
            const params = {};
            if (selectedDept && selectedDept !== 'All') params.program_id = selectedDept;
            if (selectedBatch && selectedBatch !== 'All') params.batch_id = selectedBatch;
            if (selectedYear && selectedYear !== 'All') params.academic_year = selectedYear;
            if (selectedClass && selectedClass !== 'All') params.class_name = selectedClass;
            if (selectedSemester && selectedSemester !== 'All') params.semester = selectedSemester;

            const res = await api.get('/reports/dac-reports/', { params });
            setReports(res.data);
        } catch (error) {
            console.error("Error fetching DAC reports:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file type
        const isPDF = file.type === 'application/pdf';
        const isExcel = file.type === 'application/vnd.ms-excel' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        if (!isPDF && !isExcel) {
            alert("Please upload a PDF or Excel file.");
            return;
        }

        if (isUploadDisabled) {
            alert("Please select Department, Batch, Academic Year, Class, and Semester before uploading.");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('program_id', selectedDept);
        formData.append('academic_year', selectedYear);
        formData.append('batch_id', selectedBatch);
        formData.append('class_name', selectedClass);
        formData.append('semester', selectedSemester);

        // Required API values, handling missing context for some values:

        try {
            await api.post('/reports/dac-reports/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("Report uploaded successfully!");
            loadReports();
        } catch (error) {
            console.error("Error uploading report:", error);
            alert("Failed to upload report.");
        } finally {
            setLoading(false);
            e.target.value = null; // reset input
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this report?")) {
            setLoading(true);
            try {
                await api.delete(`/reports/dac-reports/${id}/`);
                alert("Report deleted successfully!");
                loadReports();
            } catch (error) {
                console.error("Error deleting report:", error);
                alert("Failed to delete report.");
            } finally {
                setLoading(false);
            }
        }
    };

    const getProgramName = (id) => {
        const p = departments.find(prog => prog.program_id.toString() === id.toString());
        return p ? p.program_name : 'Unknown';
    };

    // Checking role directly against 'hod' and 'coordinator'. Also allowing it unconditionally if user object is somehow malformed.
    // The previous check was `user?.role?.toLowerCase() === 'hod'`. If that's failing, we might not have `role` in the `user` object.
    // Updated role check for DAC upload/delete
    const role = (user?.role || user?.role_name || "").toLowerCase();
    const canUpload = ['hod', 'coordinator', 'admin'].includes(role);

    const isUploadDisabled = loading ||
        !selectedDept || selectedDept === 'All' ||
        !selectedBatch || selectedBatch === 'All' ||
        !selectedYear || selectedYear === 'All' ||
        !selectedClass || selectedClass === 'All' ||
        !selectedSemester || selectedSemester === 'All';

    return (
        <div className="dac-container">
            <div className="dac-main-content">
                <div className="file-manager-card">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="m-0 fw-bold text-primary">DAC Reports Management</h4>
                        <div>
                            {canUpload && (
                                <>
                                    <input
                                        type="file"
                                        id="dac-upload"
                                        hidden
                                        accept=".pdf,.xls,.xlsx"
                                        onChange={handleFileUpload}
                                        disabled={isUploadDisabled}
                                    />
                                    <label
                                        htmlFor={isUploadDisabled ? "" : "dac-upload"}
                                        className={`btn btn-outline-primary d-flex align-items-center gap-2 shadow-sm fw-bold ${isUploadDisabled ? 'disabled' : ''}`}
                                        style={isUploadDisabled ? { pointerEvents: 'none', opacity: 0.6 } : {}}
                                    >
                                        <FaUpload /> Upload Report
                                    </label>
                                </>
                            )}
                        </div>
                    </div>

                    {!isValid ? (
                        <div className="alert alert-warning shadow-sm border-warning d-flex align-items-center gap-3 p-4 mb-4">
                            <FaExclamationCircle className="text-warning fs-3" />
                            <div>
                                <h5 className="fw-bold mb-1">Academic Context Required</h5>
                                <p className="mb-0">Please select the remaining filters in the top bar to proceed: <span className="fw-bold text-dark">{missingFields.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(', ')}</span></p>
                            </div>
                        </div>
                    ) : (
                        <>

                            <div className="table-responsive">
                                <table className="table table-hover file-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '35%' }}>Report Name</th>
                                            <th>Program / Details</th>
                                            <th>Date Modified</th>
                                            <th>Size</th>
                                            <th className="text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="5" className="text-center py-5">
                                                    Loading...
                                                </td>
                                            </tr>
                                        ) : reports.length > 0 ? (
                                            reports.map((file) => (
                                                <tr key={file.dac_report_id}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            {file.file.endsWith('.pdf') ?
                                                                <FaFilePdf className="file-icon text-danger me-2" /> :
                                                                <FaFileExcel className="file-icon text-success me-2" />
                                                            }
                                                            <span className="file-name text-truncate" style={{ maxWidth: '250px' }} title={file.file.split('/').pop()}>
                                                                {file.file.split('/').pop()}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="small text-muted">
                                                            <div>{file.program_name}</div>
                                                            <div>{file.academic_year} {file.class_name ? `| ${file.class_name}` : ''} {file.semester ? `| Sem ${file.semester}` : ''}</div>
                                                        </div>
                                                    </td>
                                                    <td className="text-secondary small">{new Date(file.uploaded_at).toLocaleString()}</td>
                                                    <td className="text-secondary small">-</td>
                                                    <td className="text-center">
                                                        <div className="d-flex justify-content-center gap-2">
                                                            <button
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => {
                                                                    const url = file.file.startsWith('http') ? file.file : `http://127.0.0.1:8000${file.file}`;
                                                                    window.open(url, '_blank');
                                                                }}
                                                                title="Download/View File"
                                                            >
                                                                <FaDownload />
                                                            </button>
                                                            {canUpload && (
                                                                <button
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => handleDelete(file.dac_report_id)}
                                                                >
                                                                    <FaTrash />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="text-center py-5 text-muted">
                                                    No reports found for the selected filters.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dacreview;
