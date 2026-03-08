import React, { useState, useEffect, useRef } from "react";
import "./Header.css";
import { logowhite } from "../../assets/images";
import { FaBell, FaSearch, FaBars, FaTimes, FaDownload } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getLoggedInUser } from "../../utils/auth";
import { useFilters } from "../../context/FilterContext";
import api from "../../utils/axios";


const Header = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showDownloads, setShowDownloads] = useState(false);
  const searchRef = useRef(null);
  const bellRef = useRef(null);
  const downloadRef = useRef(null);

  const {
    selectedDept, setSelectedDept,
    selectedScheme, setSelectedScheme,
    selectedCourse, selectedYear,
    departments, schemes, loadingFilters
  } = useFilters();


  const user = getLoggedInUser();
  const userRole = (user?.role || user?.role_name || "").toLowerCase();

  // Predefined list of searchable pages/functions with RBAC
  const searchItems = [
    { name: "HOD Dashboard", path: "/hod-dashboard", category: "Navigation", keywords: ["hod", "home"], allowedRoles: ["Admin", "HOD"] },
    { name: "Faculty Dashboard", path: "/faculty-dashboard", category: "Navigation", keywords: ["faculty", "home"], allowedRoles: ["Admin", "Faculty"] },
    { name: "Coordinator Dashboard", path: "/coordinator-dashboard", category: "Navigation", keywords: ["coordinator", "home"], allowedRoles: ["Admin", "Coordinator"] },
    { name: "Auditor Dashboard", path: "/auditor-dashboard", category: "Navigation", keywords: ["auditor", "home"], allowedRoles: ["Admin", "Auditor"] },
    { name: "Create User", path: "/create-user", category: "Admin", keywords: ["add user", "new user"], allowedRoles: ["Admin"] },
    { name: "User Management", path: "/view-user", category: "Admin", keywords: ["view users", "edit user", "update user", "list users", "delete user"], allowedRoles: ["Admin"] },
    { name: "Academic Setup", path: "/academic-setup", category: "Admin", keywords: ["defaults", "configuration", "semester", "year"], allowedRoles: ["Admin"] },
    { name: "Department Management", path: "/academic-setup", category: "Admin", keywords: ["department", "management", "programs", "manage departments", "add department", "academic setup"], allowedRoles: ["Admin"] },
    { name: "System Activity Log", path: "/activity-log", category: "Admin", keywords: ["activity", "history", "logs", "audit"], allowedRoles: ["Admin"] },
    { name: "PO Statement", path: "/peo-po-pso", category: "Academics", keywords: ["outcome"], allowedRoles: ["HOD", "Coordinator", "Faculty"] },
    { name: "PSO Statement", path: "/peo-po-pso", category: "Academics", keywords: ["specific outcome"], allowedRoles: ["HOD", "Coordinator", "Faculty"] },
    { name: "Course Exit Survey", path: "/course-exit-survey", category: "HOD", keywords: ["survey", "test", "ces", "course exit"], allowedRoles: ["HOD", "Coordinator"] },
    { name: "Target Management", path: "/target-management", category: "Assessment", keywords: ["target", "setting", "goal"], allowedRoles: ["HOD", "Coordinator", "Faculty"] },
    { name: "Indirect Attainment", path: "/indirect-attainment", category: "Reports", keywords: ["indirect", "attainment", "surveys", "report"], allowedRoles: ["HOD", "Coordinator"] },
    { name: "PO & PSO Attainment", path: "/po-pso-attainment", category: "Reports", keywords: ["po", "pso", "attainment", "report"], allowedRoles: ["HOD", "Coordinator"] },
    { name: "Extra-Curricular Tools", path: "/other-indirect-tools", category: "Surveys", keywords: ["expert lecture", "visit", "workshop", "extra-curricular", "feedback"], allowedRoles: ["HOD", "Coordinator", "Faculty"] },
    { name: "Course Management", path: "/course-management", category: "Academics", keywords: ["courses", "view course", "edit course"], allowedRoles: ["Admin", "HOD", "Coordinator", "Faculty"] },
    { name: "Profile", path: "/profile", category: "User", keywords: ["settings", "account", "me"], allowedRoles: ["Admin", "HOD", "Faculty", "Staff", "Auditor", "Coordinator"] },
    { name: "Marks Entry", path: "/marks-entry", category: "Assessment", keywords: ["cis", "entry"], allowedRoles: ["Faculty", "HOD", "Coordinator"] },
    { name: "Attainment Backtracking", path: "/attainment-backtracking", category: "Reports", keywords: ["backtracking", "trace", "attainment"], allowedRoles: ["HOD", "Coordinator", "Auditor"] },
  ];

  const filteredItems = searchItems
    .filter(item => item.allowedRoles.some(role => role.toLowerCase() === userRole))
    .filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  useEffect(() => {
    if (showNotifications) fetchNotifications();
  }, [showNotifications]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications/');
      setNotifications(response.data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read/`);
      setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (downloadRef.current && !downloadRef.current.contains(event.target)) {
        setShowDownloads(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSelect = (path) => {
    navigate(path);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const handleDashboardClick = () => {
    const role = (user?.role || user?.role_name || "").toUpperCase();
    if (role === 'ADMIN') navigate("/admin-dashboard");
    else if (role === 'HOD') navigate("/hod-dashboard");
    else if (role === 'FACULTY') navigate("/faculty-dashboard");
    else if (role === 'COORDINATOR') navigate("/coordinator-dashboard");
    else if (role === 'AUDITOR') navigate("/auditor-dashboard");
    else navigate("/dashboard");
  };

  const handleDownloadTemplate = async (type) => {
    try {
      let url = '';
      let filename = '';

      if (type === 'student') {
        url = '/bulk_upload/students/template/';
        filename = 'Student_Bulk_Upload_Template.xlsx';
      } else if (type === 'course') {
        url = '/bulk_upload/courses/template/';
        filename = 'Course_Bulk_Upload_Template.xlsx';
      } else if (type === 'user') {
        url = '/bulk_upload/users/template/';
        filename = 'User_Bulk_Upload_Template.xlsx';
      } else if (type === 'cis') {
        if (!selectedCourse) {
          alert("Please select a course first in the Marks Entry page.");
          return;
        }

        // Get selectedDivision from localStorage JSON object
        let divParam = '';
        try {
          const storedContext = window.localStorage.getItem('obe_academic_context');
          if (storedContext) {
            const parsed = JSON.parse(storedContext);
            divParam = parsed.selectedDivision || '';
          }
        } catch (e) {
          console.error("Error reading context from localStorage:", e);
        }

        let divQuery = '';
        if (divParam) {
          divQuery = `&division=${encodeURIComponent(divParam)}`;
        }
        url = `/bulk_upload/cis/template-multi/?course_id=${selectedCourse}&academic_year=${selectedYear}${divQuery}`;
        filename = 'Marks_Bulk_Upload_Template.xlsx';
      } else if (type === 'teaching-plan') {
        url = '/bulk_upload/teaching-plan/template/';
        filename = 'Teaching_Plan_Template.xlsx';
      }

      const response = await api.get(url, { responseType: 'blob' });
      const dlUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = dlUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setShowDownloads(false);
    } catch (err) {
      console.error("Error downloading template:", err);
      alert("Failed to download template. Please check your connection or contact administrator.");
    }
  };

  return (
    <nav className="navbar header-navbar p-0 border-0" style={{ background: 'transparent' }}>
      <div className="header container-fluid d-flex align-items-center justify-content-between px-3" style={{ height: '80px', background: 'linear-gradient(90deg, #4a90e2, #357ae8)' }}>
        {/* LEFT */}
        <div className="d-flex align-items-center gap-2">
          <button className="hamburger-btn d-lg-none" onClick={onToggleSidebar} style={{ background: '#357ae8', border: 'none', color: 'white', padding: '8px', borderRadius: '5px' }}>
            <FaBars size={22} />
          </button>
          <img src={logowhite} alt="Logo" className="header-logo" style={{ height: '55px' }} />
          <div className="header-text d-none d-lg-block text-white">
            <h2 className="mb-0 fs-5 fw-bold">Sandip Foundation</h2>
            <span className="small opacity-75">SP : Sandip Polytechnic</span>
          </div>
        </div>

        {/* DEPARTMENT (New section)
        {['faculty', 'hod', 'coordinator'].includes(userRole) && user?.department_name && (
          <div
            className="header-dept text-white mx-auto d-none d-xl-flex align-items-center justify-content-center"
            style={{
              maxWidth: '350px',
              fontSize: '16px',
              fontWeight: '500',
              textAlign: 'center',
              lineHeight: '1.2',
              padding: '0 20px',
              borderLeft: '1px solid rgba(255,255,255,0.3)',
              marginLeft: '20px'
            }}
          >
            Department: {user.department_name}
          </div>
        )} */}

        {/* CENTER */}
        <div
          className="header-title text-center text-white cursor-pointer d-none d-md-block ms-auto me-auto"
          onClick={handleDashboardClick}
          style={{ cursor: "pointer", fontSize: '24px', fontWeight: 'bold', paddingLeft: '50px', paddingRight: '50px' }}
        >
          Dashboard
        </div>

        {/* RIGHT */}
        <div className="d-flex align-items-center gap-3 position-relative">
          <div className="search-container d-none d-xl-block" ref={searchRef}>
            <div className="search-box d-flex align-items-center bg-white rounded px-2" style={{ height: '38px', width: '220px' }}>
              <FaSearch className="text-primary me-2" />
              <input
                type="text"
                className="form-control border-0 bg-transparent shadow-none"
                placeholder="Search"
                value={searchQuery}
                onFocus={() => setShowSearchResults(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: '14px' }}
              />
              {searchQuery && <FaTimes className="cursor-pointer text-muted" onClick={() => setSearchQuery("")} />}
            </div>

            {showSearchResults && searchQuery && (
              <div className="search-results-dropdown shadow position-absolute bg-white rounded mt-1 overflow-auto" style={{ top: '100%', right: 0, width: '100%', zIndex: 1100, maxHeight: '250px' }}>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, index) => (
                    <div
                      key={index}
                      className="search-result-item p-2 border-bottom cursor-pointer"
                      onClick={() => handleSearchSelect(item.path)}
                    >
                      <div className="fw-bold small text-dark">{item.name}</div>
                      <div className="text-muted small text-uppercase" style={{ fontSize: '10px' }}>{item.category}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-muted">No results found</div>
                )}
              </div>
            )}
          </div>

          {/* Global Filters - Moved to GlobalFilterBar in Layout.js */}


          {userRole !== 'auditor' && (
            <div className="notification-container" ref={downloadRef}>
              <FaDownload
                size={22}
                className="text-white cursor-pointer"
                onClick={() => {
                  setShowDownloads(!showDownloads);
                  setShowNotifications(false);
                }}
              />
              {showDownloads && (
                <div className="notifications-dropdown shadow position-absolute bg-white rounded mt-2 p-0" style={{ top: '100%', width: '280px', zIndex: 1100, border: '1px solid #dee2e6' }}>
                  <div className="p-3 border-bottom fw-bold small bg-light d-flex justify-content-between align-items-center">
                    <span>Downloads</span>
                    <FaTimes className="cursor-pointer text-muted" onClick={() => setShowDownloads(false)} />
                  </div>
                  <div className="p-0">
                    {userRole === 'admin' ? (
                      <button onClick={() => handleDownloadTemplate('user')} className="d-block w-100 text-start p-3 border-bottom border-0 bg-transparent text-dark download-item-btn" style={{ transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <div className="fw-bold small text-primary">User Bulk Upload Template</div>
                        <div className="text-muted mt-1" style={{ fontSize: '11px' }}>Excel (.xlsx) format for HOD, Faculty, etc.</div>
                      </button>
                    ) : (
                      <>
                        {['hod', 'coordinator'].includes(userRole) && (
                          <button onClick={() => handleDownloadTemplate('student')} className="d-block w-100 text-start p-3 border-bottom border-0 bg-transparent text-dark download-item-btn" style={{ transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <div className="fw-bold small text-primary">Student Bulk Upload Template</div>
                            <div className="text-muted mt-1" style={{ fontSize: '11px' }}>Excel (.xlsx) format for student data entry</div>
                          </button>
                        )}
                        {['hod', 'coordinator', 'faculty'].includes(userRole) && (
                          <button onClick={() => handleDownloadTemplate('cis')} className="d-block w-100 text-start p-3 border-bottom border-0 bg-transparent text-dark download-item-btn" style={{ transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <div className="fw-bold small text-primary">Marks Bulk Upload Template</div>
                            <div className="text-muted mt-1" style={{ fontSize: '11px' }}>Excel (.xlsx) format for CIS marks entry</div>
                          </button>
                        )}
                        {['hod', 'coordinator', 'faculty'].includes(userRole) && (
                          <button onClick={() => handleDownloadTemplate('teaching-plan')} className="d-block w-100 text-start p-3 border-bottom border-0 bg-transparent text-dark download-item-btn" style={{ transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <div className="fw-bold small text-primary">Teaching Plan Template</div>
                            <div className="text-muted mt-1" style={{ fontSize: '11px' }}>Excel (.xlsx) format for Teaching Plan entry</div>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {userRole !== 'auditor' && (
            <div className="notification-container" ref={bellRef}>
              <FaBell
                size={24}
                className="text-white cursor-pointer"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowDownloads(false);
                }}
              />
              {showNotifications && (
                <div className="notifications-dropdown shadow position-absolute bg-white rounded mt-2 p-0" style={{ top: '100%', width: '320px', zIndex: 1100, border: '1px solid #dee2e6' }}>
                  <div className="p-3 border-bottom fw-bold small bg-light d-flex justify-content-between align-items-center">
                    <span>Notifications</span>
                    <FaTimes className="cursor-pointer text-muted" onClick={() => setShowNotifications(false)} />
                  </div>
                  <div className="notification-list overflow-auto" style={{ maxHeight: '350px' }}>
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.notification_id}
                          className={`p-3 border-bottom cursor-pointer notification-item ${!n.is_read ? 'bg-light' : ''}`}
                          onClick={() => handleMarkRead(n.notification_id)}
                        >
                          <div className="d-flex justify-content-between">
                            <span className={`badge ${n.notification_type === 'DANGER' ? 'bg-danger' : n.notification_type === 'WARNING' ? 'bg-warning' : 'bg-primary'} mb-1`}>
                              {n.notification_type}
                            </span>
                            <span className="text-muted" style={{ fontSize: '10px' }}>{new Date(n.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="fw-bold small">{n.title}</div>
                          <div className="text-muted small" style={{ fontSize: '12px' }}>{n.message}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted">
                        <FaBell size={30} className="mb-2 opacity-25" />
                        <p className="mb-0">You have no new notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
