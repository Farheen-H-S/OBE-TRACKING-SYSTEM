import React from 'react';
import Header from '../../components/header/Header';
import HodSide from '../../components/sidebar/HodSide';
import { BsFileEarmarkExcelFill, BsDownload, BsEyeFill } from "react-icons/bs";
import api from '../../utils/axios';
import './Cisdirectrep.css';
import { Modal, Button, Table, Form, Alert } from 'react-bootstrap';
import { getDefaultSemester, getCachedSemesterType, getSemesterOptions } from '../../utils/semesterUtils';

export default function Cisdirectrep() {
    const [courses, setCourses] = React.useState([]);
    const [selectedCourse, setSelectedCourse] = React.useState('');
    const [selectedYear, setSelectedYear] = React.useState(`${new Date().getFullYear() - (new Date().getMonth() < 5 ? 1 : 0)} - ${new Date().getFullYear() - (new Date().getMonth() < 5 ? 0 : -1)}`);
    const [generatingCourseId, setGeneratingCourseId] = React.useState(null);

    // Filter States
    const [departments, setDepartments] = React.useState([]);
    const [schemes, setSchemes] = React.useState([]);
    const [years] = React.useState(['2024 - 25', '2025 - 26', '2026 - 27']);
    const [selectedDept, setSelectedDept] = React.useState('');
    const [selectedScheme, setSelectedScheme] = React.useState('');
    const [selectedClass, setSelectedClass] = React.useState('');
    const [selectedDivision, setSelectedDivision] = React.useState('A');
    const [selectedSem, setSelectedSem] = React.useState(() => getDefaultSemester('', getCachedSemesterType()));
    const [searchTerm, setSearchTerm] = React.useState('');

    // Preview Modal States
    const [showPreview, setShowPreview] = React.useState(false);
    const [previewLoading, setPreviewLoading] = React.useState(false);
    const [previewData, setPreviewData] = React.useState([]);
    const [previewCourse, setPreviewCourse] = React.useState(null);
    const [atrInputs, setAtrInputs] = React.useState({}); // {co_id: text}
    const [atrSaving, setAtrSaving] = React.useState(false);

    const CLASS_OPTIONS = ['FY', 'SY', 'TY'];

    // Replace local getSemesterOptions with the global utility;
    // getSemesterOptions now comes from semesterUtils

    const [semesterOptions, setSemesterOptions] = React.useState(() => getSemesterOptions(''));

    // Auto-update semester when class changes based on admin's semester_type
    React.useEffect(() => {
        if (selectedClass) {
            const semType = getCachedSemesterType();
            setSelectedSem(getDefaultSemester(selectedClass, semType));
            setSemesterOptions(getSemesterOptions(selectedClass));
        } else {
            setSemesterOptions(getSemesterOptions(''));
        }
    }, [selectedClass]);

    React.useEffect(() => {
        fetchInitialFilters();
    }, []);

    React.useEffect(() => {
        fetchCourses();
    }, [selectedDept, selectedScheme, selectedYear, selectedClass, selectedDivision, selectedSem]);

    const fetchInitialFilters = async () => {
        try {
            const [deptRes, schemeRes] = await Promise.all([
                api.get('/academics/programs/'),
                api.get('/academics/schemes/list/')
            ]);
            setDepartments(deptRes.data);
            setSchemes(schemeRes.data);

            const user = JSON.parse(localStorage.getItem('user'));
            const userDeptValue = user?.department || user?.department_id;

            let foundDeptId = '';
            if (userDeptValue) {
                const dept = deptRes.data.find(d =>
                    String(d.program_id) === String(userDeptValue) ||
                    d.program_name === userDeptValue
                );
                if (dept) foundDeptId = dept.program_id;
            }

            if (foundDeptId) setSelectedDept(foundDeptId);
            else if (deptRes.data.length > 0) setSelectedDept(deptRes.data[0].program_id);

            if (schemeRes.data.length > 0) setSelectedScheme(schemeRes.data[0].scheme_id);

            const currYear = new Date().getFullYear();
            const currMonth = new Date().getMonth(); // 0-indexed
            const academicYearStr = currMonth < 5 ? `${currYear - 1} - ${currYear}` : `${currYear} - ${currYear + 1}`;
            setSelectedYear(academicYearStr);
        } catch (err) {
            console.error("Error fetching filters:", err);
        }
    };

    const fetchCourses = async () => {
        try {
            const params = {
                program_id: selectedDept,
                scheme_id: selectedScheme,
                semester: selectedSem,
                class_year: selectedClass || undefined
            };
            const res = await api.get('/academics/courses/', { params });
            setCourses(res.data);
        } catch (err) {
            console.error("Error fetching courses:", err);
        }
    };

    const filteredCoursesDropdown = courses.filter(course =>
        (course.course_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.course_code || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleViewAttainment = async (course) => {
        try {
            setPreviewCourse(course);
            setPreviewLoading(true);
            setShowPreview(true);
            const academic_year = selectedYear.replace(/\s/g, '');
            const res = await api.get('/cis_master/direct/preview/', {
                params: { course_id: course.course_id, academic_year }
            });
            // res.data is now {attainment: [...], course_atr: "..."}
            setPreviewData(res.data.attainment);
            setAtrInputs(res.data.course_atr || '');
        } catch (err) {
            console.error("Error fetching preview:", err);
            alert("Failed to fetch attainment preview.");
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleGenerateReport = async () => {
        if (!previewCourse) return;

        const hasGaps = previewData.some(item => item.gap > 0);
        const finalAtr = atrInputs.trim() || (hasGaps ? "" : "Target achieved, we will continue to use the same teaching-learning methods to maintain the attainment level.");

        if (hasGaps && !finalAtr) {
            alert("Please provide the 'Action Taken Report' as gaps are detected.");
            return;
        }

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
                    academic_year: academic_year
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

    return (
        <div className="cisdirectrep-wrapper">
            <div className="d-flex">
                <div className="cisdirectrep-main">
                    <div className="cisdirectrep-card">

                        <div className="filter-row-v2 mb-4 p-3 bg-light rounded shadow-none border">
                            <div className="row g-3">
                                <div className="col-md">
                                    <label className="filter-label">DEPARTMENT</label>
                                    <select
                                        className="form-select filter-select"
                                        value={selectedDept}
                                        onChange={(e) => setSelectedDept(e.target.value)}
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(d => (
                                            <option key={d.program_id} value={d.program_id}>{d.program_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md">
                                    <label className="filter-label">SCHEME</label>
                                    <select
                                        className="form-select filter-select"
                                        value={selectedScheme}
                                        onChange={(e) => setSelectedScheme(e.target.value)}
                                    >
                                        <option value="">Select Scheme</option>
                                        {schemes.map(s => (
                                            <option key={s.scheme_id} value={s.scheme_id}>{s.scheme_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md">
                                    <label className="filter-label">YEAR</label>
                                    <select
                                        className="form-select filter-select"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                    >
                                        {years.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md">
                                    <label className="filter-label">CLASS</label>
                                    <select
                                        className="form-select filter-select"
                                        value={selectedClass}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSelectedClass(val);
                                            const semType = getCachedSemesterType();
                                            const defaultSem = getDefaultSemester(val, semType);
                                            setSelectedSem(defaultSem);
                                        }}
                                    >
                                        <option value="">Select Class</option>
                                        {CLASS_OPTIONS.map(c => (
                                            <option key={c} value={c}>{c} - {selectedDivision}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md" style={{ maxWidth: '100px' }}>
                                    <label className="filter-label">DIV</label>
                                    <select
                                        className="form-select filter-select"
                                        value={selectedDivision}
                                        onChange={(e) => setSelectedDivision(e.target.value)}
                                    >
                                        {['A', 'B', 'C', 'D'].map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md">
                                    <label className="filter-label">SEMESTER</label>
                                    <select
                                        className="form-select filter-select"
                                        value={selectedSem}
                                        onChange={(e) => setSelectedSem(e.target.value)}
                                        disabled={!selectedClass}
                                    >
                                        <option value="">Select Sem</option>
                                        {semesterOptions.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="mt-3">
                                <input
                                    type="text"
                                    className="form-control search-input-v2"
                                    placeholder="Search course by name or code..."
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
                                        <th rowSpan="2" style={{ color: '#1a237e' }}>FA-PR</th>
                                        <th rowSpan="2" style={{ color: '#1a237e' }}>SLA</th>
                                        <th rowSpan="2" style={{ color: '#1a237e' }}>SA-TH</th>
                                        <th rowSpan="2" style={{ color: '#1a237e' }}>SA-PR</th>
                                        <th rowSpan="2" style={{ color: '#1a237e' }}>CES</th>
                                        <th rowSpan="2" className="text-primary">Overall Att.</th>
                                        <th rowSpan="2" style={{ color: '#1a237e' }}>Target</th>
                                        <th rowSpan="2" className="text-danger">Gap</th>
                                    </tr>
                                    <tr className="bg-light">
                                        <th style={{ color: '#1a237e' }}>CT1</th>
                                        <th style={{ color: '#1a237e' }}>CT2</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.map((item) => (
                                        <tr key={item.co_id} className="text-center align-middle fw-semibold">
                                            <td className="text-primary">{item.co_number.includes('.') ? item.co_number : `CO${item.co_number.replace(/[^0-9]/g, '')}`}</td>
                                            <td>{item.tools.fa_th_1}</td>
                                            <td>{item.tools.fa_th_2}</td>
                                            <td>{item.tools.fa_pr}</td>
                                            <td>{item.tools.sla}</td>
                                            <td>{item.tools.sa_th}</td>
                                            <td>{item.tools.sa_pr}</td>
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
                                        {previewData.some(item => item.gap > 0)
                                            ? "Gaps detected. Please provide proposed actions to improve attainment."
                                            : "Targets achieved. ATR is optional; default message will be used if left blank."}
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
