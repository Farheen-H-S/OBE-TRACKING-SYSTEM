import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/axios';
import { getLoggedInUser } from '../../../utils/auth';
import { useFilters } from '../../../context/FilterContext';
import './Viewcourse1.css';

const Viewcourse1 = ({ isMyCourses = false }) => {
    const navigate = useNavigate();
    const [syllabusLink, setSyllabusLink] = useState("https://econtent.msbte.edu.in/curriculum_search/");
    const [isEditingLink, setIsEditingLink] = useState(false);
    const [newLinkValue, setNewLinkValue] = useState("");
    const [searchTerm, setSearchTerm] = useState('');
    const [copySuccess, setCopySuccess] = useState('');

    const copyToClipboard = () => {
        navigator.clipboard.writeText(syllabusLink);
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000);
    };

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const {
        selectedDept,
        selectedScheme,
        selectedIntroYear,
        selectedBatch,
        years,
        schemes
    } = useFilters();

    const user = getLoggedInUser();
    const userRole = (user?.role || user?.role_name || "").toLowerCase();
    const isAuthorizedToEdit = ['admin', 'hod', 'coordinator'].includes(userRole);

    useEffect(() => {
        fetchAcademicSetup();
    }, []);

    const fetchAcademicSetup = async () => {
        try {
            const res = await api.get('/academics/academic-setup/');
            if (res.data && res.data.curriculum_link) {
                setSyllabusLink(res.data.curriculum_link);
            }
        } catch (err) {
            console.error("Error fetching academic setup:", err);
        }
    };

    const handleEditLink = () => {
        setNewLinkValue(syllabusLink);
        setIsEditingLink(true);
    };

    const handleSaveLink = async () => {
        try {
            const res = await api.patch('/academics/academic-setup/', { curriculum_link: newLinkValue });
            setSyllabusLink(res.data.curriculum_link);
            setIsEditingLink(false);
            alert("Curriculum link updated globally!");
        } catch (err) {
            console.error("Error updating curriculum link:", err);
            alert("Failed to update curriculum link.");
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const userId = user?.user_id || user?.id;

                const params = {
                    program_id: selectedDept === 'All' ? '' : selectedDept,
                    scheme_id: selectedScheme === 'All' ? '' : selectedScheme,
                    intro_year: selectedIntroYear === 'All' ? '' : selectedIntroYear
                    // Removed batch_id because the Batch dropdown is not visible on the Course Management page,
                    // which was causing courses to be silently hidden based on state from other pages.
                };

                const courseRes = await api.get('/academics/courses/', { params });

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
    }, [isMyCourses, selectedDept, selectedScheme, selectedIntroYear, selectedBatch]);

    const filteredCourses = courses.filter(course => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
            (course.course_name || "").toLowerCase().includes(term) ||
            (course.course_code || "").toLowerCase().includes(term) ||
            (course.course_abbr || "").toLowerCase().includes(term) ||
            (course.course_title || "").toLowerCase().includes(term);

        return matchesSearch;
    });

    return (
        <div className="view-course-wrapper">
            <div className="view-course-main">
                <div className="course-card-v1">

                    {/* Syllabus Link Section */}
                    <div className="syllabus-header-v1 mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <p className="syllabus-title-v1 mb-0">MSBTE Syllabus Curriculum Search</p>
                            {isAuthorizedToEdit && !isEditingLink && (
                                <button className="btn btn-sm btn-link text-primary p-0" onClick={handleEditLink}>
                                    Edit Link
                                </button>
                            )}
                        </div>
                        <div className="syllabus-link-group-v1">
                            {isEditingLink ? (
                                <>
                                    <input
                                        type="text"
                                        className="syllabus-input-v1 flex-grow-1"
                                        value={newLinkValue}
                                        onChange={(e) => setNewLinkValue(e.target.value)}
                                        placeholder="Enter curriculum search URL..."
                                    />
                                    <button className="syllabus-copy-btn-v1 px-3 bg-success" onClick={handleSaveLink}>
                                        Save
                                    </button>
                                    <button className="syllabus-copy-btn-v1 px-3 bg-secondary" onClick={() => setIsEditingLink(false)}>
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        className="syllabus-input-v1"
                                        value={syllabusLink}
                                        readOnly
                                    />
                                    <button className="syllabus-copy-btn-v1" onClick={copyToClipboard}>
                                        {copySuccess || "Copy"}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Context Filters - Handled by GlobalFilterBar */}


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
                            {!isMyCourses && isAuthorizedToEdit && (
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
                                    <th>Intro Year</th>
                                    <th>CO Status</th>
                                    <th>Mapping Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="8" className="text-center py-4">Loading courses...</td></tr>
                                ) : filteredCourses.length === 0 ? (
                                    <tr><td colSpan="8" className="text-center py-4">No courses found.</td></tr>
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
                                        <td>{course.introduction_year || '-'}</td>
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
