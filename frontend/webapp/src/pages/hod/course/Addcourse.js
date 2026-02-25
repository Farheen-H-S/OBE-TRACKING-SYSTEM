import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../../utils/axios";
import "./Addcourse.css";
import { useFilters } from "../../../context/FilterContext";

const Addcourse = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        selectedBatch, setSelectedBatch,
        selectedYear, setSelectedYear,
        selectedClass: filterClass, setSelectedClass: setFilterClass,
        selectedSemester: filterSem, setSelectedSemester: setFilterSem,
    } = useFilters();

    const [isViewMode, setIsViewMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);

    const [formData, setFormData] = useState({
        courseId: '',
        courseCode: '',
        course_name_suffix: '',
        courseTitle: '',
        courseAbbr: '',
        scheme: '',
        program_id: '',
        class: '',
        semester: '',
        faculty: '',
        batches: [],  // Multiple batches can study this course
        assessmentTools: {
            'FA-TH': { selected: false, maxMarks: 20, type: 'Internal' },
            'FA-PR': { selected: false, maxMarks: 30, type: 'Internal' },
            'SLA': { selected: false, maxMarks: 20, type: 'Internal' },
            'SA-TH': { selected: false, maxMarks: 70, type: 'External' },
            'SA-PR': { selected: false, maxMarks: 30, type: 'External' }
        },
        courseOutcomes: [{ no: 'CO1', text: '' }]
    });

    const handleBatchToggle = (batch) => {
        setFormData(prev => {
            const current = prev.batches || [];
            const exists = current.includes(batch);
            return {
                ...prev,
                batches: exists ? current.filter(b => b !== batch) : [...current, batch]
            };
        });
    };

    const loadCourseData = async (data) => {
        setIsViewMode(true);
        try {
            const coRes = await api.get(`/academics/courses/${data.course_id}/cos/`);
            const cos = coRes.data.length > 0 ? coRes.data.map(c => ({ no: c.co_number, text: c.description, co_id: c.co_id })) : [{ no: 'CO1', text: '' }];
            setFormData({
                courseId: data.course_id,
                courseCode: data.course_code,
                courseTitle: data.course_title,
                courseAbbr: data.course_abbr,
                scheme: data.scheme_id,
                program_id: data.program_id,
                class: data.class_year,
                semester: data.semester,
                faculty: data.faculty_assigned || '',
                assessmentTools: data.assessment_tools || formData.assessmentTools,
                courseOutcomes: cos,
                course_name_suffix: data.course_name ? (data.course_abbr ? data.course_name.replace(`${data.course_abbr}-`, '') : data.course_name) : ''
            });
        } catch (err) {
            console.error("Error loading course data:", err);
        }
    };

    const years = [];
    for (let i = 2019; i <= 2030; i++) {
        years.push(`${i} - ${(i + 1).toString().slice(-2)}`);
    }

    const [faculties, setFaculties] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [schemes, setSchemes] = useState([]);
    const [existingCourses, setExistingCourses] = useState([]);

    useEffect(() => {
        // Fetch initialization data
        const fetchData = async () => {
            const user = JSON.parse(localStorage.getItem('user'));
            const userDept = user?.department || user?.department_id;

            try {
                // Fetch programs and schemes (not necessarily filtered)
                const [progRes, schemeRes] = await Promise.all([
                    api.get('/academics/programs/'),
                    api.get('/academics/schemes/list/')
                ]);
                setPrograms(progRes.data);
                setSchemes(schemeRes.data);
            } catch (err) {
                console.error("Error fetching programs/schemes:", err);
            }

            try {
                // Fetch faculty filtered by department if possible
                const facParams = { role: 'Faculty' };
                if (userDept) facParams.department = userDept;
                const facRes = await api.get('/users/', { params: facParams });
                setFaculties(facRes.data.results || facRes.data);
            } catch (err) {
                console.error("Error fetching faculties:", err);
            }

            try {
                const courseRes = await api.get('/academics/courses/');
                setExistingCourses(courseRes.data);
            } catch (err) {
                console.error("Error fetching courses:", err);
            }

            // Default program if HOD/Coordinator
            if (userDept) {
                setFormData(prev => ({ ...prev, program_id: userDept }));
            }
        };

        fetchData();

        if (location.state && location.state.initialFilters) {
            setFormData(prev => ({
                ...prev,
                program_id: location.state.initialFilters.program_id || prev.program_id,
                scheme: location.state.initialFilters.scheme || prev.scheme
            }));
        }

        if (location.state && location.state.courseData) {
            const data = location.state.courseData;
            const fetchCOs = async () => {
                try {
                    const coRes = await api.get(`/academics/courses/${data.course_id}/cos/`);
                    const cos = coRes.data.length > 0 ? coRes.data.map(c => ({ no: c.co_number, text: c.description, co_id: c.co_id })) : [{ no: 'CO1', text: '' }];
                    setFormData(prev => ({
                        ...prev,
                        courseId: data.course_id, // Changed from course_id to courseId to match state
                        courseCode: data.course_code,
                        courseTitle: data.course_title,
                        courseAbbr: data.course_abbr,
                        scheme: data.scheme_id,
                        program_id: data.program_id,
                        class: data.class_year,
                        semester: data.semester,
                        faculty: data.faculty_assigned || '',
                        assessmentTools: data.assessment_tools || prev.assessmentTools,
                        courseOutcomes: cos,
                        course_name_suffix: data.course_name ? data.course_name.replace(`${data.course_abbr}-`, '') : ''
                    }));
                } catch (err) {
                    console.error("Error fetching COs:", err);
                }
            };
            fetchCOs();
            setIsViewMode(location.state.isViewMode || false);
        }
    }, [location]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Auto-update first CO pattern if course code changes and CO1 is still at default
    useEffect(() => {
        if (formData.courseCode && formData.courseOutcomes.length === 1 && (formData.courseOutcomes[0].no === 'CO' || formData.courseOutcomes[0].no === 'CO1')) {
            const newCOs = [...formData.courseOutcomes];
            newCOs[0].no = `CO${formData.courseCode}.1`;
            setFormData(prev => ({ ...prev, courseOutcomes: newCOs }));
        }
    }, [formData.courseCode]);

    const handleToolChange = (tool, field, value) => {
        setFormData(prev => {
            const updatedTools = {
                ...prev.assessmentTools,
                [tool]: {
                    ...prev.assessmentTools[tool],
                    [field]: value
                }
            };

            // If tool is deselected, clear its marks
            if (field === 'selected' && !value) {
                updatedTools[tool].maxMarks = '';
            }

            return { ...prev, assessmentTools: updatedTools };
        });
    };

    const handleCOChange = (index, field, value) => {
        const newCOs = [...formData.courseOutcomes];
        newCOs[index][field] = value;
        setFormData({ ...formData, courseOutcomes: newCOs });
    };

    const addCORow = () => {
        const index = formData.courseOutcomes.length + 1;
        const nextNo = formData.courseCode ? `CO${formData.courseCode}.${index}` : `CO${index}`;
        setFormData({
            ...formData,
            courseOutcomes: [...formData.courseOutcomes, { no: nextNo, text: '' }]
        });
    };

    const removeCORow = () => {
        if (formData.courseOutcomes.length > 1) {
            setFormData({
                ...formData,
                courseOutcomes: formData.courseOutcomes.slice(0, -1)
            });
        }
    };

    // Auto-generate course code CO(class)(id)
    useEffect(() => {
        if (!formData.courseId && !isViewMode && formData.class) {
            const classMap = { 'FY': '1', 'SY': '2', 'TY': '3' };
            const classDigit = classMap[formData.class] || '0';

            const classCourses = existingCourses.filter(c => c.class_year === formData.class);
            const nextId = (classCourses.length + 1).toString().padStart(2, '0');

            const generatedCode = `CO${classDigit}${nextId}`;

            // Also update existing CO numbers if they are using the default prefix
            setFormData(prev => {
                const newCOs = prev.courseOutcomes.map((co, idx) => ({
                    ...co,
                    no: `${generatedCode}.${idx + 1}`
                }));
                return { ...prev, courseCode: generatedCode, courseOutcomes: newCOs };
            });
        } else if (!formData.courseId && !isViewMode && !formData.class) {
            setFormData(prev => ({ ...prev, courseCode: '', courseOutcomes: [{ no: 'CO', text: prev.courseOutcomes[0]?.text || '' }] }));
        }
    }, [formData.class, existingCourses, isViewMode, formData.courseId]);

    const getSemesterOptions = () => {
        if (formData.class === 'FY') return [1, 2];
        if (formData.class === 'SY') return [3, 4];
        if (formData.class === 'TY') return [5, 6];
        return [];
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            // Validate required fields
            const requiredFields = ['courseCode', 'course_name_suffix', 'scheme', 'program_id', 'class', 'semester', 'faculty'];
            for (let field of requiredFields) {
                if (!formData[field]) {
                    alert(`Please fill in ${field}`);
                    return;
                }
            }

            const payload = {
                course_code: formData.courseCode,
                course_name: formData.courseAbbr ? `${formData.courseAbbr}-${formData.course_name_suffix}` : formData.course_name_suffix,
                course_title: formData.courseTitle,
                course_abbr: formData.courseAbbr,
                scheme_id: formData.scheme,
                program_id: formData.program_id,
                class_year: formData.class,
                semester: formData.semester,
                faculty_assigned: formData.faculty,
                assessment_tools: formData.assessmentTools,
            };

            let response;
            if (formData.courseId) {
                response = await api.put(`/academics/courses/${formData.courseId}/`, payload);
            } else {
                response = await api.post('/academics/courses/', payload);
            }

            if (response.status === 201 || response.status === 200) {
                const cId = response.data.course_id || formData.courseId;
                // Save COs (Full Sync)
                const coData = formData.courseOutcomes
                    .filter(c => c.text.trim() !== "")
                    .map(c => ({
                        co_number: c.no,
                        description: c.text.trim()
                    }));

                if (coData.length > 0) {
                    await api.post(`/academics/courses/${cId}/cos/`, coData);
                }

                // Update course status to COMPLETED
                await api.put(`/academics/courses/${cId}/`, { co_status: 'COMPLETED' });

                alert("Course and Outcomes saved successfully!");
                navigate('/course-management');
            }
        } catch (err) {
            console.error("Error saving course:", err);
            alert("Failed to save course. Check console for details.");
        }
    };

    return (
        <div className="add-course-container">
            <div className="main-content d-flex">
                <div className="content-area p-4 w-100 bg-light overflow-auto">
                    {/* Filter Section — hidden in view mode */}
                    {!isViewMode && <div className="filter-row-v2 mb-4 p-3 bg-white rounded border shadow-sm">
                        {/* Search Bar */}
                        <div className="row mb-3">
                            <div className="col-12 position-relative">
                                <label className="filter-label">SEARCH FOR EXISTING COURSE</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-white border-end-0"><i className="bi bi-search"></i></span>
                                    <input
                                        type="text"
                                        className="form-control border-start-0 ps-0 shadow-none"
                                        placeholder="Search by code, name, title or abbreviation..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setShowSearchResults(true);
                                        }}
                                        onFocus={() => setShowSearchResults(true)}
                                    />
                                </div>
                                {showSearchResults && searchTerm && (
                                    <div className="search-results-dropdown shadow position-absolute bg-white rounded mt-1 w-100" style={{ zIndex: 1100, maxHeight: '300px', overflowY: 'auto', border: '1px solid #dee2e6' }}>
                                        {existingCourses
                                            .filter(c => {
                                                const t = searchTerm.toLowerCase();
                                                return (c.course_name || "").toLowerCase().includes(t) ||
                                                    (c.course_code || "").toLowerCase().includes(t) ||
                                                    (c.course_abbr || "").toLowerCase().includes(t) ||
                                                    (c.course_title || "").toLowerCase().includes(t);
                                            })
                                            .slice(0, 15)
                                            .map(c => (
                                                <div
                                                    key={c.course_id}
                                                    className="p-3 border-bottom search-result-item-v2 cursor-pointer hover-bg-light"
                                                    onClick={() => {
                                                        loadCourseData(c);
                                                        setSearchTerm('');
                                                        setShowSearchResults(false);
                                                    }}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div className="fw-bold text-primary">{c.course_code} - {c.course_abbr || '---'}</div>
                                                    <div className="small text-dark fw-semibold">{c.course_name}</div>
                                                    <div className="small text-muted italic" style={{ fontSize: '0.75rem' }}>{c.course_title}</div>
                                                </div>
                                            ))
                                        }
                                        {existingCourses.filter(c => {
                                            const t = searchTerm.toLowerCase();
                                            return (c.course_name || "").toLowerCase().includes(t) ||
                                                (c.course_code || "").toLowerCase().includes(t) ||
                                                (c.course_abbr || "").toLowerCase().includes(t) ||
                                                (c.course_title || "").toLowerCase().includes(t);
                                        }).length === 0 && (
                                                <div className="p-3 text-center text-muted">No courses found</div>
                                            )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="row g-3">
                            <div className="col-md">
                                <label className="filter-label">BATCH</label>
                                <select className="form-select filter-select" value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div className="col-md">
                                <label className="filter-label">ACADEMIC YEAR</label>
                                <select className="form-select filter-select" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div className="col-md">
                                <label className="filter-label">CLASS</label>
                                <select className="form-select filter-select" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
                                    <option value="All">All Classes</option>
                                    {['FY', 'SY', 'TY'].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="col-md">
                                <label className="filter-label">SEM</label>
                                <select className="form-select filter-select" value={filterSem} onChange={e => setFilterSem(e.target.value)}>
                                    <option value="All">All Semesters</option>
                                    {[1, 2, 3, 4, 5, 6].map(s => <option key={s} value={s.toString()}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>}

                    <div className="card shadow-sm border-0 p-4" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                        <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                            <h3 className="fw-bold mb-0" style={{ color: '#1a237e' }}>
                                {isViewMode ? 'Course Details' : (formData.courseId ? 'Update Course' : 'Create New Course')}
                            </h3>
                            <div className="d-flex gap-2">
                                {isViewMode && (
                                    <button
                                        className="btn btn-primary d-flex align-items-center gap-2"
                                        onClick={() => setIsViewMode(false)}
                                    >
                                        <i className="bi bi-pencil-square"></i> Edit Course
                                    </button>
                                )}
                                <button className="btn btn-outline-secondary" onClick={() => navigate('/course-management')}>Back</button>
                            </div>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="row g-4">
                                {/* Department and Scheme removed from form as they are global */}

                                <div className="col-md-4">
                                    <label className="form-label fw-bold">Course Code</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="courseCode"
                                        value={formData.courseCode}
                                        placeholder={formData.class ? "" : "Please Select Class First"}
                                        disabled={true}
                                        style={{ backgroundColor: '#f8f9fa' }}
                                    />
                                </div>
                                <div className="col-md-8">
                                    <label className="form-label fw-bold">Course Title</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="courseTitle"
                                        value={formData.courseTitle}
                                        onChange={handleChange}
                                        placeholder="eg. Data Analytics"
                                        disabled={isViewMode}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Course Abbr.</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="courseAbbr"
                                        value={formData.courseAbbr}
                                        onChange={handleChange}
                                        placeholder="eg. DAN"
                                        disabled={isViewMode}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-bold">Course Name</label>
                                    <div className="input-group">
                                        {formData.courseAbbr && (
                                            <span className="input-group-text bg-light fw-bold text-secondary">
                                                {formData.courseAbbr}-
                                            </span>
                                        )}
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="e.g. Data Analysis"
                                            value={formData.course_name_suffix}
                                            onChange={(e) => setFormData({ ...formData, course_name_suffix: e.target.value })}
                                            disabled={isViewMode}
                                        />
                                    </div>
                                </div>


                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Class</label>
                                    <select
                                        className="form-select"
                                        name="class"
                                        value={formData.class}
                                        onChange={handleChange}
                                        disabled={isViewMode}
                                    >
                                        <option value="">Select Class</option>
                                        <option value="FY">FY</option>
                                        <option value="SY">SY</option>
                                        <option value="TY">TY</option>
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Semester</label>
                                    <select
                                        className="form-select"
                                        name="semester"
                                        value={formData.semester}
                                        onChange={handleChange}
                                        disabled={isViewMode || !formData.class}
                                    >
                                        <option value="">Select Semester</option>
                                        {getSemesterOptions().map(sem => (
                                            <option key={sem} value={sem}>{sem}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Batch Assignment — clickable pill badges */}
                                <div className="col-12 mt-2">
                                    <label className="form-label fw-bold">Applicable Batches</label>
                                    <div className="d-flex flex-wrap gap-2">
                                        {years.map(y => {
                                            const isSelected = (formData.batches || []).includes(y);
                                            return (
                                                <div
                                                    key={y}
                                                    className={`badge rounded-pill px-3 py-2 ${isSelected ? 'bg-primary text-white' : 'bg-light text-dark border'}`}
                                                    style={{ cursor: isViewMode ? 'default' : 'pointer', fontSize: '0.85rem' }}
                                                    onClick={() => !isViewMode && handleBatchToggle(y)}
                                                >
                                                    {isSelected && <span className="me-1">✓</span>}
                                                    {y}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {!isViewMode && (formData.batches || []).length === 0 && (
                                        <small className="text-muted mt-1 d-block">Click to select batches that study this course</small>
                                    )}
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-bold">Assign Faculty</label>
                                    <select
                                        className="form-select"
                                        name="faculty"
                                        value={formData.faculty}
                                        onChange={handleChange}
                                        disabled={isViewMode || JSON.parse(localStorage.getItem('user'))?.role?.toUpperCase() === 'FACULTY'}
                                    >
                                        <option value="">Select Faculty</option>
                                        {faculties.map(f => (
                                            <option key={f.user_id} value={f.user_id}>{f.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-5">
                                <h4 className="fw-bold mb-4" style={{ color: '#1a237e' }}>Assessment Tools Configuration</h4>
                                <div className="table-responsive">
                                    <table className="table table-bordered align-middle blue-theme-table">
                                        <thead>
                                            <tr>
                                                <th>Tool Name</th>
                                                <th className="text-center">Type</th>
                                                <th className="text-center">Enable</th>
                                                <th>Max Marks</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.keys(formData.assessmentTools).map(tool => (
                                                <tr key={tool}>
                                                    <td className="fw-bold text-secondary">{tool}</td>
                                                    <td className="text-center">
                                                        <div className="d-flex gap-3 justify-content-center">
                                                            <div className="form-check">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="radio"
                                                                    name={`type-${tool}`}
                                                                    checked={formData.assessmentTools[tool]?.type === 'Internal'}
                                                                    onChange={() => handleToolChange(tool, 'type', 'Internal')}
                                                                    disabled={isViewMode}
                                                                />
                                                                <label className="form-check-label small">Internal</label>
                                                            </div>
                                                            <div className="form-check">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="radio"
                                                                    name={`type-${tool}`}
                                                                    checked={formData.assessmentTools[tool]?.type === 'External'}
                                                                    onChange={() => handleToolChange(tool, 'type', 'External')}
                                                                    disabled={isViewMode}
                                                                />
                                                                <label className="form-check-label small">External</label>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-center">
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            checked={formData.assessmentTools[tool]?.selected || false}
                                                            onChange={(e) => handleToolChange(tool, 'selected', e.target.checked)}
                                                            disabled={isViewMode}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="form-control form-control-sm"
                                                            style={{ maxWidth: '100px' }}
                                                            value={(formData.assessmentTools[tool]?.selected) ? (formData.assessmentTools[tool]?.maxMarks || '') : ''}
                                                            onChange={(e) => handleToolChange(tool, 'maxMarks', e.target.value)}
                                                            placeholder="Max"
                                                            disabled={isViewMode || !formData.assessmentTools[tool]?.selected}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="mt-5">
                                <div className="co-section-header">
                                    <h4 className="fw-bold mb-0" style={{ color: '#1a237e' }}>Course Outcomes (Statements)</h4>
                                </div>
                                <div className="co-table-wrapper d-flex gap-3 mt-3">
                                    <div className="co-table-container flex-grow-1">
                                        <table className="table table-bordered blue-theme-table">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '100px' }}>CO No.</th>
                                                    <th>Statement</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formData.courseOutcomes.map((co, index) => (
                                                    <tr key={index}>
                                                        <td className="fw-bold text-center align-middle bg-light">{co.no}</td>
                                                        <td className="p-2">
                                                            <textarea
                                                                className="form-control"
                                                                rows="2"
                                                                value={co.text}
                                                                onChange={(e) => handleCOChange(index, 'text', e.target.value)}
                                                                placeholder="Enter Course Outcome"
                                                                disabled={isViewMode}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {!isViewMode && (
                                        <div className="row-controls no-print d-flex flex-column pt-5">
                                            <button type="button" className="row-action-btn add-btn" onClick={addCORow} title="Add Row">+</button>
                                            {formData.courseOutcomes.length > 1 && (
                                                <button type="button" className="row-action-btn remove-btn" onClick={removeCORow} title="Remove Row">-</button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {!isViewMode && (
                                <div className="d-flex justify-content-center mt-5">
                                    <button type="submit" className="btn btn-primary btn-lg px-5 shadow-sm fw-bold">
                                        {formData.courseId ? "Update & Complete" : "Save & Complete"}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Addcourse;
