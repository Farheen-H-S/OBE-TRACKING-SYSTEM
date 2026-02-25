import React, { useState, useEffect, useRef } from "react";
import "./Header.css";
import { logowhite } from "../../assets/images";
import { FaBell, FaSearch, FaBars, FaTimes, FaDownload } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getLoggedInUser } from "../../utils/auth";
import { useFilters } from "../../context/FilterContext";


const Header = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDownloads, setShowDownloads] = useState(false);
  const searchRef = useRef(null);
  const bellRef = useRef(null);
  const downloadRef = useRef(null);

  const {
    selectedDept, setSelectedDept,
    selectedScheme, setSelectedScheme,
    departments, schemes, loadingFilters
  } = useFilters();


  const user = getLoggedInUser();
  const userRole = (user?.role || user?.role_name || "").toLowerCase();

  // Predefined list of searchable pages/functions with RBAC
  const searchItems = [
    { name: "HOD Dashboard", path: "/hod-dashboard", category: "Navigation", keywords: ["hod", "home"], allowedRoles: ["Admin", "HOD"] },
    { name: "Faculty Dashboard", path: "/faculty-dashboard", category: "Navigation", keywords: ["faculty", "home"], allowedRoles: ["Admin", "Faculty"] },
    { name: "Auditor Dashboard", path: "/auditor-dashboard", category: "Navigation", keywords: ["auditor", "home"], allowedRoles: ["Admin", "Auditor"] },
    { name: "Create User", path: "/create-user", category: "Admin", keywords: ["add user", "new user"], allowedRoles: ["Admin"] },
    { name: "User Management", path: "/view-user", category: "Admin", keywords: ["view users", "edit user", "update user", "list users", "delete user"], allowedRoles: ["Admin"] },
    { name: "Academic Setup", path: "/academic-setup", category: "Admin", keywords: ["defaults", "configuration", "semester", "year"], allowedRoles: ["Admin"] },
    { name: "Department Management", path: "/academic-setup", category: "Admin", keywords: ["department", "management", "programs", "manage departments", "add department", "academic setup"], allowedRoles: ["Admin"] },
    { name: "System Activity Log", path: "/activity-log", category: "Admin", keywords: ["activity", "history", "logs", "audit"], allowedRoles: ["Admin"] },
    { name: "PO Statement", path: "/po-statement", category: "Academics", keywords: ["outcome"], allowedRoles: ["HOD", "Faculty"] },
    { name: "PSO Statement", path: "/pso-statement", category: "Academics", keywords: ["specific outcome"], allowedRoles: ["HOD", "Faculty"] },
    { name: "Stress Create", path: "/stress-create", category: "HOD", keywords: ["survey", "test"], allowedRoles: ["HOD"] },
    { name: "Profile", path: "/profile", category: "User", keywords: ["settings", "account", "me"], allowedRoles: ["Admin", "HOD", "Faculty", "Staff", "Auditor", "Coordinator"] },
    { name: "Marks Entry", path: "/marks-entry", category: "Assessment", keywords: ["cis", "entry"], allowedRoles: ["Faculty", "HOD", "Coordinator"] },];

  const filteredItems = searchItems
    .filter(item => item.allowedRoles.some(role => role.toLowerCase() === userRole))
    .filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()))
    );

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
    else if (role === 'AUDITOR') navigate("/auditor-dashboard");
    else navigate("/dashboard");
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

          {/* Global Filters - Hidden for Admin */}
          {userRole !== 'admin' && (
            <div className="header-filters d-none d-xl-flex align-items-center gap-2">
              <div className="filter-item d-flex align-items-center bg-white rounded px-2" style={{ height: '38px', minWidth: '150px' }}>
                <select
                  className="form-select border-0 bg-transparent shadow-none p-0"
                  style={{ fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  disabled={loadingFilters}
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.program_id} value={dept.program_id}>
                      {dept.program_abbr || dept.program_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-item d-flex align-items-center bg-white rounded px-2" style={{ height: '38px', minWidth: '100px' }}>
                <select
                  className="form-select border-0 bg-transparent shadow-none p-0"
                  style={{ fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
                  value={selectedScheme}
                  onChange={(e) => setSelectedScheme(e.target.value)}
                  disabled={loadingFilters}
                >
                  <option value="">All Schemes</option>
                  {schemes.map(scheme => (
                    <option key={scheme.scheme_id} value={scheme.scheme_id}>
                      {scheme.scheme_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

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
                <div className="p-4 text-center text-muted">
                  <FaDownload size={30} className="mb-2 opacity-25" />
                  <p className="mb-0">No files available to download</p>
                </div>
              </div>
            )}
          </div>

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
                <div className="p-4 text-center text-muted">
                  <FaBell size={30} className="mb-2 opacity-25" />
                  <p className="mb-0">You have no new notifications</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
