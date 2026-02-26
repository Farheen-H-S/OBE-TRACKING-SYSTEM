import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/header/Header';
import HodSide from '../../../components/sidebar/HodSide';
import { BsFileEarmarkExcelFill, BsDownload, BsEyeFill } from "react-icons/bs";
import api from '../../../utils/axios';
import './Cisdirectrep.css';
import { Modal, Button, Table, Form, Alert } from 'react-bootstrap';
import { getDefaultSemester, getCachedSemesterType, getSemesterOptions } from '../../../utils/semesterUtils';

import { useFilters } from '../../../context/FilterContext';

export default function Cisdirectrep() {
    const navigate = useNavigate();
    const {
        selectedDept, setSelectedDept,
        selectedScheme, setSelectedScheme,
        selectedYear, setSelectedYear,
        selectedIntroYear, setSelectedIntroYear,
        selectedBatch, setSelectedBatch,
        selectedClass, setSelectedClass,
        selectedSemester: selectedSem, setSelectedSemester: setSelectedSem,
        selectedDivision, setSelectedDivision,
        programs: departments,
        schemes,
        years
    } = useFilters();

    const [courses, setCourses] = React.useState([]);
    const [selectedCourse, setSelectedCourse] = React.useState('');
    const [generatingCourseId, setGeneratingCourseId] = React.useState(null);

    // Preview Modal States
    const [showPreview, setShowPreview] = React.useState(false);
    const [previewLoading, setPreviewLoading] = React.useState(false);
    const [previewData, setPreviewData] = React.useState([]);
    const [previewCourse, setPreviewCourse] = React.useState(null);
    const [atrInputs, setAtrInputs] = React.useState({}); // {co_id: text}
    const [atrSaving, setAtrSaving] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');

    const CLASS_OPTIONS = ['FY', 'SY', 'TY'];
    const [semesterOptions, setSemesterOptions] = React.useState(() => getSemesterOptions(selectedClass || ''));

    // Auto-update semester when class changes
    React.useEffect(() => {
        if (selectedClass && selectedClass !== 'All') {
            const semType = getCachedSemesterType();
            // Only update if current semester is not valid for new class
            const options = getSemesterOptions(selectedClass);
            setSemesterOptions(options);
            if (!options.includes(parseInt(selectedSem))) {
                setSelectedSem(getDefaultSemester(selectedClass, semType));
            }
        } else {
            setSemesterOptions(getSemesterOptions(''));
        }
    }, [selectedClass]);

    React.useEffect(() => {
        if (selectedDept && selectedScheme) {
            fetchCourses();
        }
    }, [selectedDept, selectedScheme, selectedIntroYear, selectedBatch, selectedYear, selectedClass, selectedDivision, selectedSem]);

    const fetchCourses = async () => {
        try {
            const params = {
                program_id: selectedDept !== 'All' ? selectedDept : undefined,
                scheme_id: selectedScheme !== 'All' ? selectedScheme : undefined,
                semester: selectedSem !== 'All' ? selectedSem : undefined,
                intro_year: selectedIntroYear !== 'All' ? selectedIntroYear : undefined,
                class_year: (selectedClass && selectedClass !== 'All') ? selectedClass : undefined
            };
            const res = await api.get('/academics/courses/', { params });
            setCourses(res.data);
        } catch (err) {
            console.error("Error fetching courses:", err);
        }
    };

    const filteredCoursesDropdown = courses.filter(course => {
        const term = searchTerm.toLowerCase();
        return (course.course_name || "").toLowerCase().includes(term) ||
            (course.course_code || "").toLowerCase().includes(term) ||
            (course.course_title || "").toLowerCase().includes(term) ||
            (course.course_abbr || "").toLowerCase().includes(term);
    });

    const handleViewAttainment = async (course) => {
        try {
            setPreviewCourse(course);
            setPreviewLoading(true);
            setShowPreview(true);
            const academic_year = selectedYear.replace(/\s/g, '');
            const res = await api.get('/cis_master/direct/preview/', {
                params: { course_id: course.course_id, academic_year, batch_id: selectedBatch }
            });
            // res.data is now {attainment: [...], course_atr: "..."}
            setPreviewData(res.data.attainment);
            setAtrInputs(res.data.course_atr === "No ATR Submitted" ? '' : (res.data.course_atr || ''));
        } catch (err) {
            console.error("Error fetching preview:", err);
            alert("Failed to fetch attainment preview.");
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleGenerateReport = async () => {
        if (!previewCourse) return;

        // Decouple Report Generation from ATR presence
        const finalAtr = atrInputs.trim() || "No ATR Submitted";

        try {
            setAtrSaving(true);
            const academic_year = selectedYear.replace(/\s/g, '');

            const atrPayload = {
                course_id: previewCourse.course_id,
                course_atr: finalAtr
            };
            await api.post('/cis_master/direct/submit-atr/', atrPayload);

            setGeneratingCourseId(previewCourse.course_id);
            const response = await api.get('/cis_master/direct/report/', {
                params: {
                    course_id: previewCourse.course_id,
                    academic_year: academic_year,
                    batch_id: selectedBatch
                },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `CIS_Report_${previewCourse.course_code}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setShowPreview(false);
        } catch (err) {
            console.error("Error generating report:", err);
            alert("Failed to generate report.");
        } finally {
            setGeneratingCourseId(null);
            setAtrSaving(false);
        }
    };

    const handleToolNavigation = (toolName) => {
        if (!previewCourse || !toolName) return;
        const toolMap = {
            'CT1': 'FA-TH-CT1',
            'CT2': 'FA-TH-CT2',
            'FA-PR': 'FA-PR',
            'SLA': 'SLA',
            'SA-TH': 'SA-TH',
            'SA-PR': 'SA-PR'
        };
        const targetTool = toolMap[toolName] || toolName;
        const academic_year = selectedYear.replace(/\s/g, '');
        navigate('/marks-entry', {
            state: {
                course_id: previewCourse.course_id,
                course_code: previewCourse.course_code,
                academic_year: selectedYear,
                batch_id: selectedBatch,
                class_year: selectedClass,
                semester: selectedSem,
                division: selectedDivision,
                tool: targetTool
            }
        });
    };

    return (
        <div className="cisdirectrep-wrapper">
            <div className="d-flex">
                <div className="cisdirectrep-main">
                    <div className="cisdirectrep-card">

                        <div className="filter-row-v2 mb-4 p-3 bg-light rounded shadow-none border">
                            <div className="row g-3">
                                <div className="col-md">
                                    <label className="filter-label">YEAR OF INTRO</label>
                                    <select
                                        className="form-select filter-select"
                                        value={selectedIntroYear}
                                        onChange={(e) => setSelectedIntroYear(e.target.value)}
                                    >
                                        <option value="All">All</option>
                                        {years.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md">
                                    <label className="filter-label">BATCH</label>
                                    <select
                                        className="form-select filter-select"
                                        value={selectedBatch}
                                        onChange={(e) => setSelectedBatch(e.target.value)}
                                    >
                                        <option value="All">All</option>
                                        {years.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md">
                                    <label className="filter-label">ACADEMIC YEAR</label>
                                    <select
                                        className="form-select filter-select"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                    >
                                        <option value="All">All</option>
                                        {years.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md" style={{ maxWidth: '120px' }}>
                                    <label className="filter-label">CLASS</label>
                                    <select
                                        className="form-select filter-select"
                                        value={selectedClass}
                                        onChange={(e) => setSelectedClass(e.target.value)}
                                    >
                                        <option value="All">All</option>
                                        {CLASS_OPTIONS.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md" style={{ maxWidth: '80px' }}>
                                    <label className="filter-label">DIV</label>
                                    <select
                                        className="form-select filter-select"
                                        value={selectedDivision}
                                        onChange={(e) => setSelectedDivision(e.target.value)}
                                    >
                                        <option value="All">All</option>
                                        {['A', 'B', 'C', 'D'].map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md" style={{ maxWidth: '100px' }}>
                                    <label className="filter-label">SEM</label>
                                    <select
                                        className="form-select filter-select"
                                        value={selectedSem}
                                        onChange={(e) => setSelectedSem(e.target.value)}
                                    >
                                        <option value="All">All</option>
                                        {semesterOptions.map(s => (
                                            <option key={s} value={s.toString()}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="mt-3">
                                <input
                                    type="text"
                                    className="form-control search-input-v2"
                                    placeholder="Search course by code, name, title or abbreviation..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ width: '100%', borderRadius: '8px' }}
                                />
                            </div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="cis-report-title m-0">CIS Report : Direct Attainment</h2>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-bordered table-hover shadow-sm" style={{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                                <thead className="table-light">
                                    <tr>
                                        <th className="py-3 text-center" style={{ color: '#1a237e', fontWeight: '700' }}>COURSE CODE</th>
                                        <th className="py-3 text-start" style={{ color: '#1a237e', fontWeight: '700' }}>COURSE NAME</th>
                                        <th className="py-3 text-start" style={{ color: '#1a237e', fontWeight: '700' }}>COURSE TITLE</th>
                                        <th className="py-3 text-center" style={{ color: '#1a237e', fontWeight: '700' }}>ABBR.</th>
                                        <th className="py-3 text-center" style={{ color: '#1a237e', fontWeight: '700' }}>SCHEME</th>
                                        <th className="py-3 text-center" style={{ color: '#1a237e', fontWeight: '700' }}>ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCoursesDropdown.length > 0 ? (
                                        filteredCoursesDropdown.map((c) => (
                                            <tr key={c.course_id} style={{ verticalAlign: 'middle' }}>
                                                <td className="text-center fw-bold text-secondary">{c.course_code}</td>
                                                <td className="fw-bold text-dark">{c.course_name}</td>
                                                <td className="text-secondary">{c.course_title || '-'}</td>
                                                <td className="text-center">{c.course_abbr || '-'}</td>
                                                <td className="text-center"><span className="badge bg-light text-dark border">{schemes.find(s => s.scheme_id === c.scheme_id)?.scheme_name || 'K'}</span></td>
                                                <td className="text-center">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-2"
                                                        onClick={() => handleViewAttainment(c)}
                                                        style={{ borderRadius: '6px', fontWeight: '600' }}
                                                    >
                                                        <BsEyeFill size={14} />
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="text-center py-5 text-muted">
                                                No courses found matching the selected filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={showPreview} onHide={() => setShowPreview(false)} size="xl" scrollable>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title className="text-primary fw-bold">
                        Attainment Preview: {previewCourse?.course_name} ({previewCourse?.course_code})
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {previewLoading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status"></div>
                            <p className="mt-2 text-muted">Calculating attainment levels...</p>
                        </div>
                    ) : (
                        <div className="preview-container">
                            <Table bordered hover responsive className="attainment-preview-table mb-4 shadow-sm">
                                <thead className="text-center align-middle border-bottom-2">
                                    <tr className="bg-light">
                                        <th rowSpan="2" style={{ minWidth: '80px', color: '#1a237e' }}>CO No.</th>
                                        <th colSpan="2" style={{ color: '#1a237e' }}>FA-TH</th>
                                        <th rowSpan="2" style={{ color: '#1a237e' }} className="tool-click" onClick={() => handleToolNavigation('FA-PR')}>FA-PR</th>
                                        <th rowSpan="2" style={{ color: '#1a237e' }} className="tool-click" onClick={() => handleToolNavigation('SLA')}>SLA</th>
                                        <th rowSpan="2" style={{ color: '#1a237e' }} className="tool-click" onClick={() => handleToolNavigation('SA-TH')}>SA-TH</th>
                                        <th rowSpan="2" style={{ color: '#1a237e' }} className="tool-click" onClick={() => handleToolNavigation('SA-PR')}>SA-PR</th>
                                        <th rowSpan="2" style={{ color: '#1a237e' }}>CES</th>
                                        <th rowSpan="2" className="text-primary">Overall Att.</th>
                                        <th rowSpan="2" style={{ color: '#1a237e' }}>Target</th>
                                        <th rowSpan="2" className="text-danger">Gap</th>
                                    </tr>
                                    <tr className="bg-light header-navigable">
                                        <th style={{ color: '#1a237e' }} className="tool-click" onClick={() => handleToolNavigation('CT1')}>CT1</th>
                                        <th style={{ color: '#1a237e' }} className="tool-click" onClick={() => handleToolNavigation('CT2')}>CT2</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.map((item) => (
                                        <tr key={item.co_id} className="text-center align-middle fw-semibold">
                                            <td className="text-primary">{item.co_number.includes('.') ? item.co_number : `CO${item.co_number.replace(/[^0-9]/g, '')}`}</td>
                                            <td className="cell-nav" onClick={() => handleToolNavigation('CT1')}>{item.tools.fa_th_1}</td>
                                            <td className="cell-nav" onClick={() => handleToolNavigation('CT2')}>{item.tools.fa_th_2}</td>
                                            <td className="cell-nav" onClick={() => handleToolNavigation('FA-PR')}>{item.tools.fa_pr}</td>
                                            <td className="cell-nav" onClick={() => handleToolNavigation('SLA')}>{item.tools.sla}</td>
                                            <td className="cell-nav" onClick={() => handleToolNavigation('SA-TH')}>{item.tools.sa_th}</td>
                                            <td className="cell-nav" onClick={() => handleToolNavigation('SA-PR')}>{item.tools.sa_pr}</td>
                                            <td>{item.tools.ces}</td>
                                            <td className="fw-bold text-primary">{item.overall_attainment.toFixed(2)}</td>
                                            <td>{item.target.toFixed(2)}</td>
                                            <td className={`fw-bold ${item.gap > 0 ? 'text-danger' : 'text-success'}`}>
                                                {item.gap.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>

                            <div className="atr-section mt-4 p-4 bg-white rounded border shadow-sm">
                                <Form.Group>
                                    <Form.Label className="fw-bold text-primary mb-3 d-flex align-items-center gap-2">
                                        <i className="bi bi-journal-text fs-5"></i>
                                        ACTION TAKEN / PROPOSED REPORT (ATR)
                                    </Form.Label>
                                    <p className="text-muted small mb-3">
                                        Optional: Provide an Action Taken Report (ATR) if gaps are detected, or if you want to propose improvements. If left blank, 'No ATR Submitted' will be recorded.
                                    </p>
                                    <Form.Control
                                        as="textarea"
                                        rows={4}
                                        placeholder="Enter actions proposed (e.g., extra remedial classes, simplified notes...)"
                                        value={atrInputs || ''}
                                        onChange={(e) => setAtrInputs(e.target.value)}
                                        className="shadow-none border-secondary-subtle"
                                        style={{ fontSize: '15px', borderRadius: '8px' }}
                                    />
                                </Form.Group>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="bg-light">
                    <Button variant="secondary" onClick={() => setShowPreview(false)}>Close</Button>
                    <Button
                        variant="primary"
                        onClick={handleGenerateReport}
                        disabled={previewLoading || atrSaving || generatingCourseId}
                        className="d-flex align-items-center gap-2"
                    >
                        {atrSaving || generatingCourseId ? (
                            <><span className="spinner-border spinner-border-sm" role="status"></span> Processing...</>
                        ) : (
                            <><BsDownload size={16} /> Submit & Download Report</>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
