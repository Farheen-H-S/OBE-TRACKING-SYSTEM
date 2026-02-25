import React, { useState, useEffect } from 'react';
import './Dacreview.css';
import { FaFilePdf, FaUpload, FaTrash, FaFilter } from 'react-icons/fa';
import api from '../../../utils/axios';
import { getLoggedInUser } from '../../../utils/auth';

const Dacreview = () => {
    const user = getLoggedInUser();
    const [reports, setReports] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filter states
    const [filters, setFilters] = useState({
        batch: '2025 - 26',
        academicYear: '2025 - 26',
        class: '',
        semester: ''
    });

    const years = [];
    for (let i = 2019; i <= 2030; i++) {
        years.push(`${i} - ${(i + 1).toString().slice(-2)}`);
    }
    const classes = ['FY', 'SY', 'TY', 'Final Year'];
    const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];

    useEffect(() => {
        fetchPrograms();
        loadReports();
    }, []);

    const fetchPrograms = async () => {
        try {
            const res = await api.get('/academics/programs/');
            setPrograms(res.data);

            const setupKey = 'academicSetup';
            const setup = JSON.parse(localStorage.getItem(setupKey) || '{}');
            let ay = '2025 - 26';
            if (setup.academic_year) {
                ay = setup.academic_year.replace(/(\d{4})(\d{2})/, "$1 - $2");
            }

            if (res.data.length > 0 && !filters.program) {
                setFilters(prev => ({
                    ...prev,
                    program: res.data[0].program_id.toString(),
                    academicYear: ay,
                }));
            }
        } catch (err) {
            console.error("Error fetching programs:", err);
        }
    };

    const loadReports = () => {
        const storedReports = localStorage.getItem('dac_reports');
        if (storedReports) {
            setReports(JSON.parse(storedReports));
        }
    };

    const saveReports = (updatedReports) => {
        localStorage.setItem('dac_reports', JSON.stringify(updatedReports));
        setReports(updatedReports);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== 'application/pdf') {
            alert("Please upload a PDF file.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const newReport = {
                id: Date.now(),
                name: file.name,
                fileName: file.name,
                date: new Date().toLocaleString(),
                type: 'PDF Document',
                size: (file.size / 1024).toFixed(2) + ' KB',
                content: event.target.result,
                filters: { ...filters },
                submittedBy: user?.name || 'Coordinator',
                status: 'Pending' // For Task 2
            };
            const updatedReports = [newReport, ...reports];
            saveReports(updatedReports);
        };
        reader.readAsDataURL(file);
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this report?")) {
            const updatedReports = reports.filter(r => r.id !== id);
            saveReports(updatedReports);
        }
    };

    const filteredReports = reports.filter(report => {
        return (
            (!filters.program || report.filters.program === filters.program) &&
            (!filters.batch || report.filters.batch === filters.batch) &&
            (!filters.academicYear || report.filters.academicYear === filters.academicYear) &&
            (!filters.class || report.filters.class === filters.class) &&
            (!filters.semester || report.filters.semester === filters.semester)
        );
    });

    const getProgramName = (id) => {
        const p = programs.find(prog => prog.program_id.toString() === id);
        return p ? p.program_name : 'Unknown';
    };

    return (
        <div className="dac-container">
            <div className="dac-main-content">
                <div className="file-manager-card">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="m-0 fw-bold text-primary">DAC Reports Management</h4>
                        <div>
                            <input
                                type="file"
                                id="dac-upload"
                                hidden
                                accept=".pdf"
                                onChange={handleFileUpload}
                            />
                            <label htmlFor="dac-upload" className="btn btn-primary d-flex align-items-center gap-2">
                                <FaUpload /> Upload Report
                            </label>
                        </div>
                    </div>

                    {/* Filters Section */}
                    <div className="filters-grid mb-4 p-3 bg-light rounded shadow-sm">
                        <div className="row g-3">
                            <div className="col-md">
                                <label className="form-label small fw-bold text-uppercase">Batch</label>
                                <select
                                    className="form-select form-select-sm"
                                    name="batch"
                                    value={filters.batch}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All Batches</option>
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div className="col-md">
                                <label className="form-label small fw-bold text-uppercase">Academic Year</label>
                                <select
                                    className="form-select form-select-sm"
                                    name="academicYear"
                                    value={filters.academicYear}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All Years</option>
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div className="col-md" style={{ maxWidth: '100px' }}>
                                <label className="form-label small fw-bold text-uppercase">Class</label>
                                <select
                                    className="form-select form-select-sm"
                                    name="class"
                                    value={filters.class}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All</option>
                                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="col-md" style={{ maxWidth: '100px' }}>
                                <label className="form-label small fw-bold text-uppercase">Sem</label>
                                <select
                                    className="form-select form-select-sm"
                                    name="semester"
                                    value={filters.semester}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All</option>
                                    {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

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
                                {filteredReports.length > 0 ? (
                                    filteredReports.map((file) => (
                                        <tr key={file.id}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <FaFilePdf className="file-icon text-danger me-2" />
                                                    <span className="file-name text-truncate" style={{ maxWidth: '250px' }} title={file.name}>
                                                        {file.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="small text-muted">
                                                    <div>{getProgramName(file.filters.program)}</div>
                                                    <div>{file.filters.introYear} | {file.filters.class} | {file.filters.semester}</div>
                                                </div>
                                            </td>
                                            <td className="text-secondary small">{file.date}</td>
                                            <td className="text-secondary small">{file.size}</td>
                                            <td className="text-center">
                                                <div className="d-flex justify-content-center gap-2">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => {
                                                            const win = window.open();
                                                            win.document.write(`<iframe src="${file.content}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                                        }}
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDelete(file.id)}
                                                    >
                                                        <FaTrash />
                                                    </button>
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
                </div>
            </div>
        </div>
    );
};

export default Dacreview;
