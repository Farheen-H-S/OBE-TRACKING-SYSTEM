import React, { useState } from 'react';
import sidebar from './Sidebar.css';
import { FaCircle, FaMinus, FaPlus } from 'react-icons/fa';
import Pofile from './admin/profile.jpeg';

const sidebar = () => {

    // STATE FOR SIDEBAR TOGGLE
    const [openMenu, setOpenMenu] = useState(null);

    const toggleMenu = (menu) => {
        setOpenMenu(openMenu === menu ? null : menu);
    };

    return (
         <div className="sidebar">

                    <div className="user-banner">
                        <div className="user-banner-img">
                            <img src={Pofile} alt="profile pic" />
                        </div>
                        <div className="user-banner-info">
                            <h3>Welcome Mitesh!</h3>
                            <p>312023016</p>
                        </div>
                    </div>

                    <div className="user-role-bar">
                        User : HOD
                    </div>

                    {/* MENU */}
                    <ul className="sidebar-menu">
                        {/* View Statements */}
                        <li className="menu-item has-submenu">
                            <div className="menu-title" onClick={() => toggleMenu("viewStatements")}>
                                <FaCircle className="menu-dot" />
                                View Statements
                                {openMenu === "viewStatements" ? <FaMinus /> : <FaPlus />}
                            </div>

                            {openMenu === "viewStatements" && (
                                <div className="submenu">
                                    <div>CO Statements</div>
                                    <div>PO Statements</div>
                                    <div>PSO Statements</div>
                                </div>
                            )}
                        </li>

                        {/* Stress Analysis */}
                        <li className="menu-item has-submenu">
                            <div className="menu-title" onClick={() => toggleMenu("stressAnalysis")}>
                                <FaCircle className="menu-dot" />
                                Stress Analysis
                                {openMenu === "stressAnalysis" ? <FaMinus /> : <FaPlus />}
                            </div>

                            {openMenu === "stressAnalysis" && (
                                <div className="submenu">
                                    <div>Stress Survey</div>
                                    <div>Stress Report</div>
                                </div>
                            )}
                        </li>

                        <li className="menu-item">
                            <FaCircle className="menu-dot" /> CO-PO mapping
                        </li>

                        {/* CIS */}
                        <li className="menu-item has-submenu">
                            <div className="menu-title" onClick={() => toggleMenu("cis")}>
                                <FaCircle className="menu-dot" />
                                CIS
                                {openMenu === "cis" ? <FaMinus /> : <FaPlus />}
                            </div>

                            {openMenu === "cis" && (
                                <div className="submenu">
                                    <div>CIS entry</div>
                                    <div>Direct</div>
                                    <div>Indirect</div>
                                    <div>CIS report</div>
                                </div>
                            )}
                        </li>

                        <li className="menu-item">
                            <FaCircle className="menu-dot" /> Assign Target
                        </li>

                        <li className="menu-item">
                            <FaCircle className="menu-dot" /> Track Target
                        </li>

                        {/* DAC */}
                        <li className="menu-item has-submenu">
                            <div className="menu-title" onClick={() => toggleMenu("dac")}>
                                <FaCircle className="menu-dot" />
                                DAC Report
                                {openMenu === "dac" ? <FaMinus /> : <FaPlus />}
                            </div>

                            {openMenu === "dac" && (
                                <div className="submenu">
                                    <div>View</div>
                                    <div>Upload</div>
                                </div>
                            )}
                        </li>

                        <li className="menu-item">
                            <FaCircle className="menu-dot" /> Mapping View
                        </li>

                        <li className="menu-item">
                            <FaCircle className="menu-dot" /> Backtracking
                        </li>

                    </ul>
                </div>
    )
}
export default sidebar;