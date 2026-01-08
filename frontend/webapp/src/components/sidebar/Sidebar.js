import React, { useState } from 'react';
import './Sidebar.css';
import { FaCircle, FaMinus, FaPlus } from 'react-icons/fa';
import profileImg from '../../assets/images/profile.jpeg';

const Sidebar = ({ role = "HOD" }) => {

    const [openMenu, setOpenMenu] = useState(null);

    const toggleMenu = (menu) => {
        setOpenMenu(openMenu === menu ? null : menu);
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
        <div className="sidebar">

            <div className="user-banner">
                <div className="user-banner-img">
                    <img src={profileImg} alt="profile pic" />
                </div>
                <div className="user-banner-info">
                    <h3>Welcome Mitesh!</h3>
                    <p>312023016</p>
                </div>
            </div>

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
            </ul>
        </div>
    );
}

export default Sidebar;
