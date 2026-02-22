import React, { useState, useEffect } from 'react';
import './Cisentry.css';
import { students } from '../../../data/studentData';
import { sampleCourses, sampleCOs } from '../../../data/sampleData';
import api from '../../../utils/axios';
import { FaPaperclip, FaFilePdf, FaInfoCircle, FaEye } from 'react-icons/fa';
import { getDefaultSemester, getCachedSemesterType } from '../../../utils/semesterUtils';

const ViewCisEntries = () => {
    // State for dynamic data
    const [programs, setPrograms] = useState([]);
    const [courses, setCourses] = useState([]);
    const [schemes, setSchemes] = useState([]);
    const [academicYear, setAcademicYear] = useState('');
    const [coCount, setCoCount] = useState(0);

    // Selection state
    const [selectedProgram, setSelectedProgram] = useState('');
    const [selectedScheme, setSelectedScheme] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedClass, setSelectedClass] = useState('FY');
    const [selectedDivision, setSelectedDivision] = useState('A');
    const [selectedSemester, setSelectedSemester] = useState(() => getDefaultSemester('FY', getCachedSemesterType()));
    const [selectedCourse, setSelectedCourse] = useState('');
    const [assessmentType, setAssessmentType] = useState('Internal');
    const [selectedTool, setSelectedTool] = useState('FA-TH-CT1');

    // Loaded data
    const [savedData, setSavedData] = useState(null);

    const getCTQuestionLabel = (index) => {
        const qNum = Math.floor(index / 7) + 1;
        const subQ = String.fromCharCode(97 + (index % 7));
        return `${qNum}(${subQ})`;
    };

    const defaultQuestions = selectedTool === 'FA-PR'
        ? Array.from({ length: 60 }, (_, i) => `${i + 1}`)
        : selectedTool === 'SLA'
            ? Array.from({ length: 60 }, (_, i) => `${String(i + 1).padStart(2, '0')}`)
            : Array.from({ length: 60 }, (_, i) => getCTQuestionLabel(i));

    const defaultWeights = selectedTool === 'FA-PR'
        ? new Array(60).fill('1')
        : selectedTool === 'SLA'
            ? new Array(60).fill('20')
            : (selectedTool === 'SA-TH' || selectedTool === 'SA-PR')
                ? new Array(60).fill((savedData?.totalMaxMarks || 10).toString())
                : Array.from({ length: 60 }, (_, i) => (i % 14 < 7 ? '2' : '4'));

    const toolOptions = {
        Internal: [
            { value: 'FA-TH-CT1', label: 'FA-TH (Class Test 1)' },
            { value: 'FA-TH-CT2', label: 'FA-TH (Class Test 2)' },
            { value: 'FA-PR', label: 'FA-PR (K3)' },
            { value: 'SLA', label: 'SLA (Self Learning Assessment)' }
        ],
        External: [
            { value: 'SA-TH', label: 'SA-TH (Theory)' },
            { value: 'SA-PR', label: 'SA-PR (Practical)' }
        ]
    };

    useEffect(() => {
        fetchAcademicData();
    }, []);

    const fetchAcademicData = async () => {
        try {
            const [progRes, schemeRes, setupRes] = await Promise.all([
                api.get('/academics/programs/'),
                api.get('/academics/schemes/list/'),
                api.get('/academics/academic-setup/')
            ]);
            setPrograms(progRes.data);
            setSchemes(schemeRes.data);
            if (setupRes.data) {
                setAcademicYear(setupRes.data.academic_year);
                setSelectedYear(setupRes.data.academic_year);
                setSelectedScheme(setupRes.data.scheme_id);
                localStorage.setItem('academicSetup', JSON.stringify(setupRes.data));
                setSelectedSemester(getDefaultSemester('FY', setupRes.data.semester_type || 'Odd'));
            }
            if (progRes.data.length > 0) setSelectedProgram(progRes.data[0].program_id);
        } catch (error) {
            console.error("Error fetching initial academic data:", error);
        }
    };

    useEffect(() => {
        if (selectedProgram) fetchCourses();
    }, [selectedProgram, selectedSemester]);

    // Auto-update semester when class changes
    useEffect(() => {
        const semType = getCachedSemesterType();
        setSelectedSemester(getDefaultSemester(selectedClass, semType));
    }, [selectedClass]);

    useEffect(() => {
        loadSavedData();
    }, [selectedCourse, selectedTool]);

    const loadSavedData = () => {
        if (!selectedCourse || !selectedTool) {
            setSavedData(null);
            return;
        }

        try {
            const data = localStorage.getItem(`cis_entry_${selectedCourse}_${selectedTool}`);
            if (data) {
                const parsed = JSON.parse(data);
                setSavedData(parsed);
            } else {
                setSavedData(null);
            }
        } catch (err) {
            console.error("Error loading saved data from localStorage:", err);
            setSavedData(null);
        }
    };

    const getSLAColumnStats = () => {
        if (!savedData || !savedData.marksData) return [];
        const colCount = savedData.columnCount || 1;
        const stats = [];
        for (let col = 0; col < colCount; col++) {
            let sum = 0;
            let appearedCount = 0;
            let marks = [];
            students.forEach(student => {
                const val = savedData.marksData[student.enrollment]?.[col];
                if (val !== undefined && val !== '' && val !== null) {
                    const numericVal = parseFloat(val);
                    if (!isNaN(numericVal)) {
                        sum += numericVal;
                        appearedCount++;
                        marks.push(numericVal);
                    }
                }
            });
            const average = appearedCount > 0 ? sum / appearedCount : 0;
            const aboveAvgCount = marks.filter(m => m >= average).length;
            const percentAboveAvg = appearedCount > 0 ? (aboveAvgCount / appearedCount) * 100 : 0;
            const coAttainment = (percentAboveAvg / 100) * 3;
            stats.push({
                average: average.toFixed(2),
                aboveAvgCount,
                appearedCount,
                absentCount: students.length - appearedCount,
                percentAboveAvg: percentAboveAvg.toFixed(2),
                coAttainment: coAttainment.toFixed(2)
            });
        }
        return stats;
    };

    const openBase64InNewTab = (base64Data, filename) => {
        try {
            // Decode base64
            const parts = base64Data.split(';base64,');
            const contentType = parts[0].split(':')[1];
            const raw = window.atob(parts[1]);
            const rawLength = raw.length;
            const uInt8Array = new Uint8Array(rawLength);

            for (let i = 0; i < rawLength; ++i) {
                uInt8Array[i] = raw.charCodeAt(i);
            }

            const blob = new Blob([uInt8Array], { type: contentType });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Error opening PDF:", error);
            // Fallback to iframe write if blob fails (though blob is preferred)
            const win = window.open();
            win.document.write(
                '<iframe src="' + base64Data + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>'
            );
        }
    };

    const fetchCourses = async () => {
        try {
            const response = await api.get(`/academics/courses/?program_id=${selectedProgram}`);
            const filteredCourses = response.data.filter(c => c.semester === parseInt(selectedSemester));
            if (filteredCourses.length > 0) {
                setCourses(filteredCourses);
                setSelectedCourse(filteredCourses[0].course_id);
            } else {
                const samples = sampleCourses.filter(c => c.semester === parseInt(selectedSemester));
                setCourses(samples);
                if (samples.length > 0) setSelectedCourse(samples[0].course_id);
            }
        } catch (error) {
            const samples = sampleCourses.filter(c => c.semester === parseInt(selectedSemester));
            setCourses(samples);
            if (samples.length > 0) setSelectedCourse(samples[0].course_id);
        }
    };

    const fetchCoCount = async () => {
        try {
            const response = await api.get(`/academics/courses/${selectedCourse}/cos/`);
            if (response.data && response.data.length > 0) {
                setCoCount(response.data.length);
            } else {
                setCoCount(5); // Default to 5 for sample data
            }
        } catch (error) {
            setCoCount(5); // Default to 5 for sample data or error
        }
    };

    useEffect(() => {
        if (selectedCourse) {
            fetchCoCount();
        }
    }, [selectedCourse]);


    const handleAssessmentTypeChange = (type) => {
        setAssessmentType(type);
        setSelectedTool(toolOptions[type][0].value);
    };

    return (
        <div className="p-4" style={{ backgroundColor: '#f0f8ff', minHeight: '100vh' }}>
            <div className="bg-white p-4 rounded shadow-sm">
                <h2 className="text-center mb-4 section-title" style={{ color: '#2c3e50', fontWeight: 'bold', fontSize: 30 }}>
                    View CIS Assessment
                </h2>

                {/* Card 1: Localized Filters */}
                <div className="bg-white p-4 rounded shadow-sm mb-4">
                    <div className="filters-section bg-light p-3 rounded" style={{ border: '1px solid #e0e0e0' }}>
                        <div className="row g-3 mb-3">
                            <div className="col-md-4">
                                <label className="form-label fw-bold small text-muted text-uppercase">Department</label>
                                <select className="form-select border-primary-subtle" value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)}>
                                    {programs.map(p => <option key={p.program_id} value={p.program_id}>{p.program_name}</option>)}
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label className="form-label fw-bold small text-muted text-uppercase">Scheme</label>
                                <select className="form-select border-primary-subtle" value={selectedScheme} onChange={(e) => setSelectedScheme(e.target.value)}>
                                    {schemes.map(s => <option key={s.scheme_id} value={s.scheme_id}>{s.scheme_name}</option>)}
                                </select>
                            </div>
                            <div className="col-md-2">
                                <label className="form-label fw-bold small text-muted text-uppercase">Year</label>
                                <select className="form-select border-primary-subtle" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                                    <option value={academicYear}>{academicYear}</option>
                                    <option value="2024-25">2024-25</option>
                                    <option value="2023-24">2023-24</option>
                                </select>
                            </div>
                            <div className="col-md-2">
                                <label className="form-label fw-bold small text-muted text-uppercase">Class</label>
                                <select className="form-select border-primary-subtle" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                                    <option value="FY">FY - {selectedDivision}</option>
                                    <option value="SY">SY - {selectedDivision}</option>
                                    <option value="TY">TY - {selectedDivision}</option>
                                </select>
                            </div>
                            <div className="col-md-2">
                                <label className="form-label fw-bold small text-muted text-uppercase">Div</label>
                                <select className="form-select border-primary-subtle" value={selectedDivision} onChange={(e) => setSelectedDivision(e.target.value)}>
                                    {['A', 'B', 'C', 'D'].map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="row g-3 mb-0">
                            <div className="col-md-2">
                                <label className="form-label fw-bold small text-muted text-uppercase">Semester</label>
                                <select className="form-select border-primary-subtle" value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="col-md-10">
                                <label className="form-label fw-bold small text-muted text-uppercase">Course</label>
                                <select className="form-select border-primary-subtle" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
                                    {courses.length > 0 ? courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>) : <option value="">No courses found</option>}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {selectedCourse && (
                    <div className="mt-4 p-3 rounded" style={{ backgroundColor: '#f8fbff', border: '1px solid #adcaf8' }}>
                        <h5 className="small fw-bold text-primary text-uppercase mb-3" style={{ letterSpacing: '1px' }}>Course Outcome (CO) Statements</h5>
                        <div className="row g-3">
                            {(sampleCOs[selectedCourse] || sampleCOs['default']).slice(0, 5).map((co, idx) => (
                                <div key={idx} className="col-md-12 d-flex gap-3">
                                    <span className="badge rounded-pill bg-primary d-flex align-items-center justify-content-center" style={{ width: '45px', minWidth: '45px', height: '24px' }}>CO{idx + 1}</span>
                                    <p className="mb-0 small text-muted" style={{ lineHeight: '1.5' }}>{co}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Card 2: Tool Selection */}
            <div className="bg-white p-4 rounded shadow-sm mb-4">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-4">
                    <div>
                        <h3 className="mb-1 section-title" style={{ color: '#2c3e50', fontWeight: 'bold' }}>CIS Assessment - View Entries</h3>
                        <p className="text-muted small mb-0">Select assessment type and tool to view marks</p>
                    </div>

                    <div className="d-flex gap-2 bg-light p-1 rounded" style={{ border: '1px solid #dee2e6' }}>
                        <button
                            className={`btn btn-sm px-4 py-2 fw-bold transition-all ${assessmentType === 'Internal' ? 'btn-primary shadow-sm' : 'btn-light text-muted border-0'}`}
                            onClick={() => handleAssessmentTypeChange('Internal')}
                            style={{ borderRadius: '5px' }}
                        >
                            Internal
                        </button>
                        <button
                            className={`btn btn-sm px-4 py-2 fw-bold transition-all ${assessmentType === 'External' ? 'btn-primary shadow-sm' : 'btn-light text-muted border-0'}`}
                            onClick={() => handleAssessmentTypeChange('External')}
                            style={{ borderRadius: '5px' }}
                        >
                            External
                        </button>
                    </div>

                    <div style={{ width: '100%', maxWidth: '400px' }}>
                        <label className="form-label fw-bold mb-2 text-muted small text-uppercase" style={{ color: '#2c3e50', letterSpacing: '0.5px' }}>
                            Select Assessment Tool
                        </label>
                        <select
                            className="form-select"
                            value={selectedTool}
                            onChange={(e) => setSelectedTool(e.target.value)}
                            style={{ borderRadius: '6px', border: '1px solid #dee2e6' }}
                        >
                            {toolOptions[assessmentType].map(tool => (
                                <option key={tool.value} value={tool.value}>{tool.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Card 3: Table Results */}
            {savedData ? (
                <div className="bg-white p-4 rounded shadow-sm">
                    <h4 className="mb-3 test-title text-start fs-5 fw-bold" style={{ color: '#2c3e50' }}>
                        Analysis for {selectedTool.replace('FA-TH-', '').replace('SA-', '')}
                    </h4>
                    <div className="table-responsive cis-table-container">
                        <table className="table table-bordered cis-table text-center align-middle mb-0">
                            <thead>
                                {selectedTool === 'SA-TH' || selectedTool === 'SA-PR' ? (
                                    <tr>
                                        <th className="student-col-header fw-bold bg-light" style={{ width: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', borderBottom: '2px solid #dee2e6' }}>Enrollment No.</th>
                                        <th className="student-col-header fw-bold bg-light" style={{ width: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', borderBottom: '2px solid #dee2e6' }}>Roll No.</th>
                                        <th className="student-col-header fw-bold bg-light" style={{ width: 'auto', minWidth: '250px', verticalAlign: 'middle', borderBottom: '2px solid #dee2e6' }}>Name of Student</th>
                                        <th className="fw-bold text-white text-center" style={{ width: '200px', backgroundColor: '#557fb9', verticalAlign: 'middle' }}>
                                            Total Marks {savedData.totalMaxMarks ? `(out of ${savedData.totalMaxMarks})` : ''}
                                        </th>
                                    </tr>
                                ) : selectedTool === 'SLA' ? (
                                    <tr>
                                        <th className="student-col-header fw-bold bg-light" style={{ width: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', borderBottom: '2px solid #dee2e6' }}>Enrollment No.</th>
                                        <th className="student-col-header fw-bold bg-light" style={{ width: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', borderBottom: '2px solid #dee2e6' }}>Roll No.</th>
                                        <th className="student-col-header fw-bold bg-light" style={{ width: 'auto', minWidth: '250px', verticalAlign: 'middle', borderBottom: '2px solid #dee2e6' }}>Name of Student</th>
                                        <th className="blue-header-cell text-white" style={{ backgroundColor: '#6c8ebf', width: 'auto', whiteSpace: 'nowrap' }}>Assignments</th>
                                        {defaultQuestions.slice(0, savedData.columnCount || 14).map((q, index) => (
                                            <th key={index} className="fw-bold" style={{ width: 'auto', minWidth: '100px', backgroundColor: '#adcaf8', color: 'black' }}>
                                                {savedData.customQuestions?.[index] || q}
                                            </th>
                                        ))}
                                        <th className="bg-light" style={{ width: '20px' }}></th>
                                        <th className="fw-bold text-white" style={{ width: 'auto', minWidth: '120px', backgroundColor: '#557fb9', verticalAlign: 'middle' }}>
                                            Total Marks {savedData.totalMaxMarks ? `(out of ${savedData.totalMaxMarks})` : ''}
                                        </th>
                                    </tr>
                                ) : (
                                    <>
                                        <tr>
                                            <th rowSpan="3" className="student-col-header bg-light fw-bold" style={{ width: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>Enrollment No.</th>
                                            <th rowSpan="3" className="student-col-header bg-light fw-bold" style={{ width: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>Roll No.</th>
                                            <th rowSpan="3" className="student-col-header bg-light fw-bold" style={{ width: 'auto', minWidth: '250px', verticalAlign: 'middle' }}>Name of Student</th>
                                            <th className="blue-header-cell text-white" style={{ backgroundColor: '#6c8ebf', width: 'auto', whiteSpace: 'nowrap' }}>
                                                {selectedTool === 'FA-PR' ? 'Practical No.' : 'Q- ->'}
                                            </th>
                                            {defaultQuestions.slice(0, savedData.columnCount || (selectedTool === 'FA-PR' ? 30 : 14)).map((q, index) => (
                                                <th key={index} className="fw-bold" style={{ width: 'auto', minWidth: '80px', backgroundColor: '#f8f9fa' }}>
                                                    {savedData.customQuestions?.[index] || q}
                                                </th>
                                            ))}
                                            <th className="bg-light" style={{ width: '20px' }}></th>
                                            <th rowSpan="3" className="fw-bold text-white" style={{ width: 'auto', minWidth: '120px', backgroundColor: '#557fb9', verticalAlign: 'middle', borderLeft: '2px solid #dee2e6' }}>
                                                Total Marks {savedData.totalMaxMarks ? `(out of ${savedData.totalMaxMarks})` : ''}
                                            </th>
                                        </tr>
                                        <tr>
                                            <th className="blue-header-cell text-white" style={{ backgroundColor: '#557fb9', width: 'auto', whiteSpace: 'nowrap' }}>
                                                {selectedTool === 'FA-PR' ? 'Max Marks' : 'WT- ->'}
                                            </th>
                                            {defaultWeights.slice(0, savedData.columnCount || (selectedTool === 'FA-PR' ? 30 : 14)).map((w, index) => (
                                                <th key={index} style={{ width: 'auto', minWidth: '80px', backgroundColor: '#f8f9fa' }}>
                                                    {savedData.customWeights?.[index] || w}
                                                </th>
                                            ))}
                                            <th className="bg-light"></th>
                                        </tr>
                                        <tr>
                                            <th className="blue-header-cell text-white" style={{ backgroundColor: '#6c8ebf', width: 'auto', whiteSpace: 'nowrap' }}>
                                                {selectedTool === 'FA-PR' ? 'Course Outcome' : 'CO ->'}
                                            </th>
                                            {defaultQuestions.slice(0, savedData.columnCount || (selectedTool === 'FA-PR' ? 30 : 14)).map((_, index) => (
                                                <th key={index} className="fw-bold" style={{ backgroundColor: '#f2f2f2', width: 'auto', minWidth: '80px', color: '#333' }}>
                                                    {savedData.userCos[index]}
                                                </th>
                                            ))}
                                            <th style={{ backgroundColor: '#f2f2f2' }}></th>
                                        </tr>
                                    </>
                                )}
                            </thead>
                            <tbody>
                                {students.map((student, rowIndex) => (
                                    <tr key={rowIndex}>
                                        <td style={{ backgroundColor: '#ffffff', width: 'auto', whiteSpace: 'nowrap' }}>{student.enrollment_no}</td>
                                        <td style={{ backgroundColor: '#ffffff', width: 'auto', whiteSpace: 'nowrap' }}>{student.roll_no
                                        }</td>
                                        <td className="text-start ps-3" style={{ backgroundColor: '#ffffff', width: 'auto', minWidth: '250px' }}>{student.name}</td>
                                        {selectedTool === 'SA-TH' || selectedTool === 'SA-PR' ? (
                                            <td className="fw-bold text-center" style={{ backgroundColor: '#f0f7ff', width: '200px' }}>
                                                {savedData.marksData[student.enrollment_no]?.[0] || '-'}
                                            </td>
                                        ) : (
                                            <>
                                                <td style={{ backgroundColor: '#6c8ebf' }}></td>
                                                {defaultQuestions.slice(0, savedData.columnCount || (selectedTool === 'FA-PR' ? 30 : 14)).map((_, colIndex) => (
                                                    <td key={colIndex} style={{ backgroundColor: '#ffffff', width: 'auto', minWidth: '80px' }}>
                                                        {savedData.marksData[student.enrollment]?.[colIndex] || '-'}
                                                    </td>
                                                ))}
                                                <td className="bg-light"></td>
                                                <td className="fw-bold" style={{ backgroundColor: '#f0f7ff', borderLeft: '2px solid #dee2e6', width: 'auto', minWidth: '120px' }}>
                                                    {savedData.marksData[student.enrollment]?.['total'] || '-'}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="fw-bold">
                                {selectedTool === 'SLA' ? (
                                    <>
                                        <tr>
                                            <td colSpan="3" className="text-end pe-3" style={{ backgroundColor: '#ebf5ff' }}>Average</td>
                                            <td style={{ backgroundColor: '#ebf5ff' }}></td>
                                            {getSLAColumnStats().map((stat, i) => (
                                                <td key={i} style={{ backgroundColor: '#ebf5ff' }}>{stat.average}</td>
                                            ))}
                                            <td className="bg-light"></td>
                                            <td style={{ backgroundColor: '#ebf5ff' }}></td>
                                        </tr>
                                        <tr>
                                            <td colSpan="3" className="text-end pe-3" style={{ backgroundColor: '#ebf5ff' }}>Number of Students getting equal and more than average</td>
                                            <td style={{ backgroundColor: '#ebf5ff' }}></td>
                                            {getSLAColumnStats().map((stat, i) => (
                                                <td key={i} style={{ backgroundColor: '#ebf5ff' }}>{stat.aboveAvgCount}</td>
                                            ))}
                                            <td className="bg-light"></td>
                                            <td style={{ backgroundColor: '#ebf5ff' }}></td>
                                        </tr>
                                        <tr>
                                            <td colSpan="3" className="text-end pe-3" style={{ backgroundColor: '#cbdcf8' }}>Total Students Appeared</td>
                                            <td style={{ backgroundColor: '#cbdcf8' }}></td>
                                            {getSLAColumnStats().map((stat, i) => (
                                                <td key={i} style={{ backgroundColor: '#cbdcf8' }}>{stat.appearedCount}</td>
                                            ))}
                                            <td className="bg-light"></td>
                                            <td style={{ backgroundColor: '#cbdcf8' }}></td>
                                        </tr>
                                        <tr>
                                            <td colSpan="3" className="text-end pe-3" style={{ backgroundColor: '#cbdcf8' }}>Number of students are Absent</td>
                                            <td style={{ backgroundColor: '#cbdcf8' }}></td>
                                            {getSLAColumnStats().map((stat, i) => (
                                                <td key={i} style={{ backgroundColor: '#cbdcf8' }}>{stat.absentCount}</td>
                                            ))}
                                            <td className="bg-light"></td>
                                            <td style={{ backgroundColor: '#cbdcf8' }}></td>
                                        </tr>
                                        <tr>
                                            <td colSpan="3" className="text-end pe-3" style={{ backgroundColor: '#ebf5ff' }}>% of Student scored more than average</td>
                                            <td style={{ backgroundColor: '#ebf5ff' }}></td>
                                            {getSLAColumnStats().map((stat, i) => (
                                                <td key={i} style={{ backgroundColor: '#ebf5ff' }}>{stat.percentAboveAvg}</td>
                                            ))}
                                            <td className="bg-light"></td>
                                            <td style={{ backgroundColor: '#ebf5ff' }}></td>
                                        </tr>
                                        <tr>
                                            <td colSpan="3" className="text-end pe-3" style={{ backgroundColor: '#ebf5ff' }}>CO Attainment</td>
                                            <td style={{ backgroundColor: '#ebf5ff' }}></td>
                                            {getSLAColumnStats().map((stat, i) => (
                                                <td key={i} style={{ backgroundColor: '#ebf5ff' }}>{stat.coAttainment}</td>
                                            ))}
                                            <td className="bg-light"></td>
                                            <td style={{ backgroundColor: '#ebf5ff' }}></td>
                                        </tr>
                                    </>
                                ) : (selectedTool === 'SA-TH' || selectedTool === 'SA-PR') ? (
                                    <>
                                        <tr>
                                            <td colSpan="3" className="text-end pe-3" style={{ backgroundColor: '#ebf5ff' }}>Average</td>
                                            <td className="fw-bold small" style={{ backgroundColor: '#e9f2fb' }}>
                                                {(() => {
                                                    const validMarks = students.map(s => parseFloat(savedData.marksData[s.enrollment]?.[0])).filter(m => !isNaN(m));
                                                    const total = validMarks.reduce((a, b) => a + b, 0);
                                                    return (validMarks.length ? (total / validMarks.length).toFixed(2) : '0.00');
                                                })()}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan="3" className="text-end pe-3" style={{ backgroundColor: '#cfe2f3' }}>Number of Students getting equal and more than average</td>
                                            <td className="fw-bold small" style={{ backgroundColor: '#cfe2f3' }}>
                                                {(() => {
                                                    const validMarks = students.map(s => parseFloat(savedData.marksData[s.enrollment]?.[0])).filter(m => !isNaN(m));
                                                    const avg = validMarks.length ? (validMarks.reduce((a, b) => a + b, 0) / validMarks.length) : 0;
                                                    return students.filter(s => {
                                                        const mark = parseFloat(savedData.marksData[s.enrollment]?.[0]);
                                                        return !isNaN(mark) && mark >= avg;
                                                    }).length;
                                                })()}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan="3" className="text-end pe-3" style={{ backgroundColor: '#ebf5ff' }}>Total Students Appeared</td>
                                            <td className="fw-bold small" style={{ backgroundColor: '#e9f2fb' }}>
                                                {students.filter(s => {
                                                    const mark = savedData.marksData[s.enrollment]?.[0];
                                                    return mark !== undefined && mark !== '' && mark !== null;
                                                }).length}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan="3" className="text-end pe-3" style={{ backgroundColor: '#cfe2f3' }}>Number of students are Absent</td>
                                            <td className="fw-bold small" style={{ backgroundColor: '#cfe2f3' }}>
                                                {(() => {
                                                    const appeared = students.filter(s => {
                                                        const mark = savedData.marksData[s.enrollment]?.[0];
                                                        return mark !== undefined && mark !== '' && mark !== null;
                                                    }).length;
                                                    return students.length - appeared;
                                                })()}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan="3" className="text-end pe-3" style={{ backgroundColor: '#ebf5ff' }}>% of Student scored more than average</td>
                                            <td className="fw-bold small" style={{ backgroundColor: '#e9f2fb' }}>
                                                {(() => {
                                                    const appeared = students.filter(s => {
                                                        const mark = savedData.marksData[s.enrollment]?.[0];
                                                        return mark !== undefined && mark !== '' && mark !== null;
                                                    }).length;
                                                    const validMarks = students.map(s => parseFloat(savedData.marksData[s.enrollment]?.[0])).filter(m => !isNaN(m));
                                                    const avg = validMarks.length ? (validMarks.reduce((a, b) => a + b, 0) / validMarks.length) : 0;
                                                    const count = students.filter(s => {
                                                        const mark = parseFloat(savedData.marksData[s.enrollment]?.[0]);
                                                        return !isNaN(mark) && mark >= avg;
                                                    }).length;
                                                    return appeared ? ((count / appeared) * 100).toFixed(2) : '0.00';
                                                })()}%
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan="3" className="text-end pe-3" style={{ backgroundColor: '#b4c7e7' }}>CO ATTAINMENT</td>
                                            <td className="fw-bold small" style={{ backgroundColor: '#b4c7e7' }}>
                                                {savedData.attainment?.[0]?.percent.toFixed(2) || '0.00'}%
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan="3" className="text-end pe-3" style={{ backgroundColor: '#d6e9ff', color: 'black' }}>CO</td>
                                            <td className="text-center" style={{ backgroundColor: '#d6e9ff', color: 'black' }}>
                                                {savedData.userCos?.[0] || '1'}
                                            </td>
                                        </tr>
                                    </>
                                ) : (
                                    <>
                                        <tr>
                                            <td colSpan="3" className="text-end pe-3" style={{ backgroundColor: '#ebf5ff' }}>Percentage Attainment</td>
                                            <td style={{ backgroundColor: '#ebf5ff' }}></td>
                                            {savedData.attainment.map((att, i) => (
                                                <td key={i} style={{ backgroundColor: '#f0f7ff' }}>{att.percent.toFixed(2)}</td>
                                            ))}
                                            <td className="bg-light"></td>
                                            <td style={{ backgroundColor: '#f0f7ff' }}></td>
                                        </tr>
                                        <tr>
                                            <td colSpan="3" className="text-end pe-3" style={{ backgroundColor: '#f8f9fa' }}>CO ATTAINMENT</td>
                                            <td style={{ backgroundColor: '#f8f9fa' }}></td>
                                            {savedData.attainment.map((att, i) => (
                                                <td key={i} style={{ backgroundColor: '#f8f9fa' }}>{att.level.toFixed(2)}</td>
                                            ))}
                                            <td className="bg-light"></td>
                                            <td style={{ backgroundColor: '#f8f9fa' }}></td>
                                        </tr>
                                        <tr>
                                            <td colSpan="3" className="text-end pe-3" style={{ backgroundColor: '#d6e9ff', color: 'black' }}>CO</td>
                                            <td style={{ backgroundColor: '#d6e9ff' }}></td>
                                            {savedData.userCos.map((co, i) => (
                                                <td key={i} style={{ backgroundColor: '#d6e9ff', color: 'black' }}>{co}</td>
                                            ))}
                                            <td className="bg-light"></td>
                                            <td style={{ backgroundColor: '#d6e9ff' }}></td>
                                        </tr>
                                    </>
                                )}
                            </tfoot>
                        </table>
                    </div>

                    {/* Evidence Section */}
                    {savedData.uploadedFiles && savedData.uploadedFiles.length > 0 && (
                        <div className="mt-4 pt-4 border-top">
                            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 text-primary" style={{ fontSize: '1.2rem' }}>
                                <FaPaperclip /> Assessment Evidence
                            </h5>
                            <div className="d-flex flex-wrap gap-3">
                                {savedData.uploadedFiles.map((file, idx) => (
                                    <div key={idx} className="file-tag d-flex align-items-center gap-3 bg-white border rounded shadow-sm p-3" style={{ minWidth: '250px' }}>
                                        <FaFilePdf className="text-danger fs-3" />
                                        <div className="flex-grow-1 overflow-hidden">
                                            <div className="fw-bold text-dark text-truncate" title={file.name}>{file.name}</div>
                                            <div className="text-muted small">{(file.size / 1024).toFixed(2)} KB</div>
                                        </div>
                                        <button
                                            className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                                            onClick={() => {
                                                if (file.content) {
                                                    openBase64InNewTab(file.content, file.name);
                                                } else {
                                                    alert("File content not found.");
                                                }
                                            }}
                                        >
                                            <FaEye /> View
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-5 text-muted bg-white rounded shadow-sm">
                    <FaInfoCircle className="fs-2 mb-3 d-block mx-auto text-primary opacity-50" />
                    No data saved for this selection.
                </div>
            )}
        </div>
    );
};

export default ViewCisEntries;
