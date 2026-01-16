import React, { useState } from 'react';
import './Sidebar.css';
import { FaCircle, FaMinus, FaPlus } from 'react-icons/fa';
import profileImg from '../../assets/images/profile.jpeg';

<<<<<<< HEAD
const Sidebar = ({ role = "HOD" }) => {
=======
const Adminside = () => {
>>>>>>> bst-login-fix

    const [openMenu, setOpenMenu] = useState(null);
    const [openSubMenu, setOpenSubMenu] = useState(null);

    const toggleMenu = (menu) => {
        setOpenMenu(openMenu === menu ? null : menu);
        setOpenSubMenu(null); // Close nested submenus when main menu changes
    };

    const toggleSubMenu = (menu) => {
        setOpenSubMenu(openSubMenu === menu ? null : menu);
    };

    // Role-based menu (hardcoded)
    const menuItems = [
        { name: "View Statements", submenus: ["CO Statements", "PO Statements", "PSO Statements"], roles: ["HOD", "Faculty"] },
        { name: "Stress Analysis", submenus: ["Stress Survey", "Stress Report"], roles: ["HOD"] },
        { name: "CO-PO mapping", roles: ["HOD"] },
        { name: "CIS", submenus: ["CIS entry", "Direct", "Indirect", "CIS report"], roles: ["HOD"] },
        { name: "Assign Target", roles: ["HOD"] },
        { name: "Track Target", roles: ["HOD"] },
        { name: "DAC Report", submenus: ["View", "Upload"], roles: ["HOD"] },
        { name: "Mapping View", roles: ["HOD"] },
        { name: "Backtracking", roles: ["HOD"] },
    ];

    return (
        <div
            className="sidebar d-flex flex-column flex-shrink-0 text-white"
            style={{
                width: '320px',
                height: '100%', /* Fits exactly into dashboard-body */
                background: 'linear-gradient(to bottom, #60a5fa, #3b82f6)',
                overflow: 'hidden' /* Prevents container itself from scrolling */
            }}
        >

<<<<<<< HEAD
            <div className="user-banner">
                <div className="user-banner-img">
                    <img src={profileImg} alt="profile pic" />
=======
            {/* Header Section - Fixed */}
            <div className="user-banner p-3 text-center flex-shrink-0">
                <div className="user-banner-img mb-2">
                    <img src={Pofile} alt="profile pic" className="rounded-circle border border-3 border-white" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
>>>>>>> bst-login-fix
                </div>
                <div className="user-banner-info">
                    <h3 className="fs-3.5 bold-0" style={{ color: '#0e2344' }}>Welcome Mitesh!</h3>
                    <p className="fs-5 fw-bold mb-0" style={{ color: '#0e2344' }}>312023016</p>
                    <h5 className="fw-semibold mb-0" style={{ color: '#ffffff', marginLeft: '180px' }}>Log out!</h5>
                </div>
            </div>

<<<<<<< HEAD
            <div className="user-role-bar">
                User : {role}
            </div>

            <ul className="sidebar-menu">
                {menuItems.map((item, idx) => {
                    if (!item.roles.includes(role)) return null;
                    const hasSubmenu = item.submenus && item.submenus.length > 0;
                    return (
                        <li key={idx} className={`menu-item ${hasSubmenu ? 'has-submenu' : ''}`}>
                            <div
                                className="menu-title"
                                onClick={() => hasSubmenu ? toggleMenu(item.name) : console.log(item.name)}
                            >
                                <FaCircle className="menu-dot" />
                                <span className="menu-text">{item.name}</span>
                                {hasSubmenu && (openMenu === item.name ? <FaMinus /> : <FaPlus />)}
                            </div>

                            {hasSubmenu && openMenu === item.name && (
                                <div className="submenu">
                                    {item.submenus.map((sm, i) => (
                                        <div key={i} className="submenu-item">{sm}</div>
                                    ))}
                                </div>
                            )}
                        </li>
                    );
                })}
=======
            <div className="user-role-bar p-3 fw-bold fs-5 flex-shrink-0" style={{ color: 'rgb(4, 38, 80)', background: 'rgba(248, 249, 252, 0.1)' }}>
                User : HOD
            </div>

            {/* MENU LIST - Scrollable */}
            <ul
                className="sidebar-menu nav nav-pills flex-column mb-0 p-0 list-unstyled overflow-auto flex-grow-1"
                style={{
                    scrollbarWidth: 'thin',
                    minHeight: 0,
                    paddingBottom: '100px' /* Extra space at bottom to ensure last items are visible when expanded */
                }}
            >
                {/* user management */}
                <li className="nav-item">
                    <div className="menu-item nav-link d-flex align-items-center text-white cursor-pointer" onClick={() => toggleMenu("View statement")} style={{ cursor: 'pointer' }}>
                        <FaCircle className="menu-dot me-3" style={{ fontSize: '0.6rem' }} />
                        <span className="flex-grow-1">View statement</span>
                        {openMenu === "View statement" ? <FaMinus /> : <FaPlus />}
                    </div>

                    {openMenu === "View statement" && (
                        <div className="submenu ps-5 bg-black bg-opacity-10 w-100">
                            <div className="py-2 text-white cursor-pointer" style={{ cursor: 'pointer' }}>CO statement</div>
                            <div className="py-2 text-white cursor-pointer" style={{ cursor: 'pointer' }}>PO statement</div>
                            <div className="py-2 text-white cursor-pointer" style={{ cursor: 'pointer' }}>PSO statement</div>

                        </div>
                    )}
                </li>


                <li className="nav-item">
                    <div className="menu-item nav-link d-flex align-items-center text-white cursor-pointer" style={{ cursor: 'pointer' }}>
                        <FaCircle className="menu-dot me-3" style={{ fontSize: '0.6rem' }} />
                        CO-PO mapping
                    </div>
                </li>

                {/* Student management */}
                <li className="nav-item">
                    <div className="menu-item nav-link d-flex align-items-center text-white cursor-pointer" onClick={() => toggleMenu("Student management")} style={{ cursor: 'pointer' }}>
                        <FaCircle className="menu-dot me-3" style={{ fontSize: '0.6rem' }} />
                        <span className="flex-grow-1">Student management</span>
                        {openMenu === "Student management" ? <FaMinus /> : <FaPlus />}
                    </div>

                    {openMenu === "Student management" && (
                        <div className="submenu ps-5 bg-black bg-opacity-10 w-100">
                            <div className="py-2 text-white cursor-pointer" style={{ cursor: 'pointer' }}>Add students</div>
                            <div className="py-2 text-white cursor-pointer" style={{ cursor: 'pointer' }}>Update students</div>
                        </div>
                    )}
                </li>

                {/* Course Management */}
                <li className="nav-item">
                    <div className="menu-item nav-link d-flex align-items-center text-white cursor-pointer" onClick={() => toggleMenu("Course Management")} style={{ cursor: 'pointer' }}>
                        <FaCircle className="menu-dot me-3" style={{ fontSize: '0.6rem' }} />
                        <span className="flex-grow-1">Course Management</span>
                        {openMenu === "Course Management" ? <FaMinus /> : <FaPlus />}
                    </div>

                    {openMenu === "Course Management" && (
                        <div className="submenu ps-5 bg-black bg-opacity-10 w-100">
                            <div className="py-2 text-white cursor-pointer" style={{ cursor: 'pointer' }}>Add Course</div>
                            <div className="py-2 text-white cursor-pointer" style={{ cursor: 'pointer' }}>View Course</div>
                        </div>
                    )}
                </li>

                {/* CIS */}
                <li className="nav-item">
                    <div className="menu-item nav-link d-flex align-items-center text-white cursor-pointer" onClick={() => toggleMenu("CIS")} style={{ cursor: 'pointer' }}>
                        <FaCircle className="menu-dot me-3" style={{ fontSize: '0.6rem' }} />
                        <span className="flex-grow-1">CIS</span>
                        {openMenu === "CIS" ? <FaMinus /> : <FaPlus />}
                    </div>

                    {openMenu === "CIS" && (
                        <div className="submenu ps-5 bg-black bg-opacity-10 w-100">
                            {/* CIS Survey (Nested) */}
                            <div
                                className="py-2 text-white cursor-pointer d-flex align-items-center justify-content-between pe-3"
                                onClick={(e) => { e.stopPropagation(); toggleSubMenu("CIS Survey"); }}
                                style={{ cursor: 'pointer' }}
                            >
                                <span>CIS Survey</span>
                                {openSubMenu === "CIS Survey" ? <FaMinus size={10} /> : <FaPlus size={10} />}
                            </div>
                            {openSubMenu === "CIS Survey" && (
                                <div className="ps-3 border-start border-white border-opacity-25 ms-2 mb-2">
                                    <div className="py-1 text-white small cursor-pointer" style={{ cursor: 'pointer' }}>Course Exit Survey Creation</div>
                                    <div className="py-1 text-white small cursor-pointer" style={{ cursor: 'pointer' }}>Indirect Tool Survey Creation</div>
                                </div>
                            )}

                            {/* CIS Report (Nested) */}
                            <div
                                className="py-2 text-white cursor-pointer d-flex align-items-center justify-content-between pe-3"
                                onClick={(e) => { e.stopPropagation(); toggleSubMenu("CIS Report"); }}
                                style={{ cursor: 'pointer' }}
                            >
                                <span>CIS Report</span>
                                {openSubMenu === "CIS Report" ? <FaMinus size={10} /> : <FaPlus size={10} />}
                            </div>
                            {openSubMenu === "CIS Report" && (
                                <div className="ps-3 border-start border-white border-opacity-25 ms-2 mb-2">
                                    <div className="py-1 text-white small cursor-pointer" style={{ cursor: 'pointer' }}>Direct Reports</div>
                                    <div className="py-1 text-white small cursor-pointer" style={{ cursor: 'pointer' }}>Indirect Reports</div>
                                </div>
                            )}
                        </div>
                    )}
                </li>

                {/* Target Management */}
                <li className="nav-item">
                    <div className="menu-item nav-link d-flex align-items-center text-white cursor-pointer" onClick={() => toggleMenu("Target Management")} style={{ cursor: 'pointer' }}>
                        <FaCircle className="menu-dot me-3" style={{ fontSize: '0.6rem' }} />
                        <span className="flex-grow-1">Target Management</span>
                        {openMenu === "Target Management" ? <FaMinus /> : <FaPlus />}
                    </div>

                    {openMenu === "Target Management" && (
                        <div className="submenu ps-5 bg-black bg-opacity-10 w-100">
                            <div className="py-2 text-white cursor-pointer" style={{ cursor: 'pointer' }}>Assign Target</div>
                            <div className="py-2 text-white cursor-pointer" style={{ cursor: 'pointer' }}>Track Target</div>
                        </div>
                    )}
                </li>

                {/* DAC Report */}
                <li className="nav-item">
                    <div className="menu-item nav-link d-flex align-items-center text-white cursor-pointer" onClick={() => toggleMenu("DAC Report")} style={{ cursor: 'pointer' }}>
                        <FaCircle className="menu-dot me-3" style={{ fontSize: '0.6rem' }} />
                        <span className="flex-grow-1">DAC Report</span>
                        {openMenu === "DAC Report" ? <FaMinus /> : <FaPlus />}
                    </div>

                    {openMenu === "DAC Report" && (
                        <div className="submenu ps-5 bg-black bg-opacity-10 w-100">
                            <div className="py-2 text-white cursor-pointer" style={{ cursor: 'pointer' }}>View Report</div>
                            <div className="py-2 text-white cursor-pointer" style={{ cursor: 'pointer' }}>Upload Report</div>
                        </div>
                    )}
                </li>

                {/* Report Verification */}
                <li className="nav-item">
                    <div className="menu-item nav-link d-flex align-items-center text-white cursor-pointer" style={{ cursor: 'pointer' }}>
                        <FaCircle className="menu-dot me-3" style={{ fontSize: '0.6rem' }} />
                        Report Verification
                    </div>
                </li>

                {/* Attainment Backtracking */}
                <li className="nav-item">
                    <div className="menu-item nav-link d-flex align-items-center text-white cursor-pointer" style={{ cursor: 'pointer' }}>
                        <FaCircle className="menu-dot me-3" style={{ fontSize: '0.6rem' }} />
                        Backtracking
                    </div>
                </li>

                {/* Student Stress Analysis */}
                <li className="nav-item">
                    <div className="menu-item nav-link d-flex align-items-center text-white cursor-pointer" onClick={() => toggleMenu("Student Stress Analysis")} style={{ cursor: 'pointer' }}>
                        <FaCircle className="menu-dot me-3" style={{ fontSize: '0.6rem' }} />
                        <span className="flex-grow-1">Student Stress Analysis</span>
                        {openMenu === "Student Stress Analysis" ? <FaMinus /> : <FaPlus />}
                    </div>

                    {openMenu === "Student Stress Analysis" && (
                        <div className="submenu ps-5 bg-black bg-opacity-10 w-100">
                            <div className="py-2 text-white cursor-pointer" style={{ cursor: 'pointer' }}>Stress Survey Creation</div>
                            <div className="py-2 text-white cursor-pointer" style={{ cursor: 'pointer' }}>Stress Analysis Report</div>
                        </div>
                    )}
                </li>

                {/* Teacher Feedback */}
                <li className="nav-item">
                    <div className="menu-item nav-link d-flex align-items-center text-white cursor-pointer" onClick={() => toggleMenu("Teacher Feedback")} style={{ cursor: 'pointer' }}>
                        <FaCircle className="menu-dot me-3" style={{ fontSize: '0.6rem' }} />
                        <span className="flex-grow-1">Teacher Feedback</span>
                        {openMenu === "Teacher Feedback" ? <FaMinus /> : <FaPlus />}
                    </div>

                    {openMenu === "Teacher Feedback" && (
                        <div className="submenu ps-5 bg-black bg-opacity-10 w-100">
                            <div className="py-2 text-white cursor-pointer" style={{ cursor: 'pointer' }}>Feedback Survey Creation</div>
                            <div className="py-2 text-white cursor-pointer" style={{ cursor: 'pointer' }}>Feedback Analysis Report</div>
                        </div>
                    )}
                </li>

                {/* Templates */}
                <li className="nav-item">
                    <div className="menu-item nav-link d-flex align-items-center text-white cursor-pointer" style={{ cursor: 'pointer' }}>
                        <FaCircle className="menu-dot me-3" style={{ fontSize: '0.6rem' }} />
                        Templates
                    </div>
                </li>
>>>>>>> bst-login-fix
            </ul>
        </div>
    );
}
<<<<<<< HEAD

export default Sidebar;
=======
export default Adminside;
>>>>>>> bst-login-fix
