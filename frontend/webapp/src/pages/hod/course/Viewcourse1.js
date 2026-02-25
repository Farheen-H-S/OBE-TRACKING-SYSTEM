import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/axios';
import { useFilters } from '../../../context/FilterContext';
import './Viewcourse1.css';

const Viewcourse1 = ({ isMyCourses = false }) => {
    const navigate = useNavigate();
    const syllabusLink = "https://econtent.msbte.edu.in/curriculum_search/";

    const [searchTerm, setSearchTerm] = useState('');
    const [copySuccess, setCopySuccess] = useState('');

    const copyToClipboard = () => {
        navigator.clipboard.writeText(syllabusLink);
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000);
    };

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    // Global filters are still used for API calls but not shown in UI
    const { selectedDept, selectedScheme, departments, schemes } = useFilters();

    const [selectedIntroYear, setSelectedIntroYear] = useState('2025 - 26');

    const years = [];
    for (let i = 2019; i <= 2030; i++) {
        years.push(`${i} - ${(i + 1).toString().slice(-2)}`);
    }

    useEffect(() => {
        const setupKey = 'academicSetup';
        const setup = JSON.parse(localStorage.getItem(setupKey) || '{}');
        if (setup.academic_year) {
            const ay = setup.academic_year.replace(/(\d{4})(\d{2})/, "$1 - $2");
            setSelectedIntroYear(ay);
        }
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const user = JSON.parse(localStorage.getItem('user'));
                const userId = user?.user_id || user?.id;

                const params = {
                    program_id: selectedDept,
                    scheme_id: selectedScheme,
                    intro_year: selectedIntroYear
                };

                const [courseRes] = await Promise.all([
                    api.get('/academics/courses/', { params })
                ]);

                let fetchedCourses = courseRes.data;
                if (isMyCourses && userId) {
                    fetchedCourses = fetchedCourses.filter(c => String(c.faculty_assigned) === String(userId));
                }

                setCourses(fetchedCourses);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching data:", err);
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [isMyCourses, selectedDept, selectedScheme, selectedIntroYear]);

    const filteredCourses = courses.filter(course => {
        const matchesSearch = (course.course_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (course.course_code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (course.course_title || "").toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDept = !selectedDept || course.program_id === parseInt(selectedDept);
        const matchesScheme = !selectedScheme || course.scheme_id === parseInt(selectedScheme);

        return matchesSearch && matchesDept && matchesScheme;
    });

    return (
        <div className="view-course-wrapper">
            <div className="view-course-main">
                <div className="course-card-v1">

                    {/* Syllabus Link Section */}
                    <div className="syllabus-header-v1 mb-4">
                        <p className="syllabus-title-v1">MSBTE Syllabus Curriculum Search</p>
                        <div className="syllabus-link-group-v1">
                            <input
                                type="text"
                                className="syllabus-input-v1"
                                value={syllabusLink}
                                readOnly
                            />
                            <button className="syllabus-copy-btn-v1" onClick={copyToClipboard}>
                                {copySuccess || "Copy"}
                            </button>
                        </div>
                    </div>

                    {/* Filter Section */}
                    <div className="filter-row-v1 mb-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                        <div className="filter-group-v1">
                            <label>YEAR OF INTRODUCTION</label>
                            <select
                                className="filter-select-v1"
                                value={selectedIntroYear}
                                onChange={(e) => setSelectedIntroYear(e.target.value)}
                            >
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* All Courses Row */}
                    <div className="courses-header-row-v1 mb-3">
                        <h5 className="all-courses-title-v1">{isMyCourses ? 'My Assigned Courses :' : 'All Courses :'}</h5>
                        <div className="search-and-add-v1">
                            <input
                                type="text"
                                className="course-search-field-v1"
                                placeholder="Search course..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {!isMyCourses && (
                                <button
                                    className="add-course-btn-v1"
                                    onClick={() => navigate('/add-course', {
                                        state: {
                                            initialFilters: {
                                                intro_year: selectedIntroYear
                                            }
                                        }
                                    })}
                                >
                                    + Add Course
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Course Table */}
                    <div className="course-table-container-v1">
                        <table className="course-grid-v1">
                            <thead>
                                <tr>
                                    <th>Course Code</th>
                                    <th>Course Name</th>
                                    <th>Course Title</th>
                                    <th>Abbr.</th>
                                    <th>Scheme</th>
                                    <th>CO Status</th>
                                    <th>Mapping Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="7" className="text-center py-4">Loading courses...</td></tr>
                                ) : filteredCourses.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center py-4">No courses found.</td></tr>
                                ) : filteredCourses.map((course, index) => (
                                    <tr
                                        key={index}
                                        onClick={() => navigate('/add-course', { state: { courseData: course, isViewMode: true } })}
                                        className="clickable-row-v1"
                                    >
                                        <td>{course.course_code}</td>
                                        <td>{course.course_name}</td>
                                        <td className="name-cell-v1">{course.course_title}</td>
                                        <td>{course.course_abbr}</td>
                                        <td>{course.scheme_name || (schemes.find(s => s.scheme_id === course.scheme_id)?.scheme_name) || "K"}</td>
                                        <td>
                                            <span className={`status-badge-v1 ${course.co_status?.toLowerCase() === 'completed' ? 'status-completed' : 'status-pending'}`}>
                                                {course.co_status || 'PENDING'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge-v1 ${course.mapping_status?.toLowerCase() === 'completed' ? 'status-completed' : 'status-pending'}`}>
                                                {course.mapping_status || 'PENDING'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <p className="instruction-note-v1 mt-3">
                        {isMyCourses ? "* Click on your courses to view details" : "* Click on above courses to view details & assigned faculty"}
                    </p>

                </div>
            </div>
        </div>
    );
};

export default Viewcourse1;
