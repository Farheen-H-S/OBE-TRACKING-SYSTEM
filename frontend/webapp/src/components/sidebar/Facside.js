import React, { useState } from 'react';
import './Facside.css';
import { FaCircle, FaMinus, FaPlus } from 'react-icons/fa';
import Pofile from '../../admin/profile.jpeg';

const Facside = () => {

    // STATE FOR SIDEBAR TOGGLE
    const [openMenu, setOpenMenu] = useState(null);
    const [openSubMenu, setOpenSubMenu] = useState(null);

    const toggleMenu = (menu) => {
        setOpenMenu(openMenu === menu ? null : menu);
        setOpenSubMenu(null); // Close nested submenus when main menu changes
    };

    const toggleSubMenu = (menu) => {
        setOpenSubMenu(openSubMenu === menu ? null : menu);
    };

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

            {/* Header Section - Fixed */}
            <div className="user-banner p-3 text-center flex-shrink-0">
                <div className="user-banner-img mb-2">
                    <img src={Pofile} alt="profile pic" className="rounded-circle border border-3 border-white" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                </div>
                <div className="user-banner-info">
                    <h3 className="fs-3.5 bold-0" style={{ color: '#0e2344' }}>Welcome Ritesh!</h3>
                    <p className="fs-5 fw-bold mb-0" style={{ color: '#0e2344' }}>312023013</p>
                    <h5 className="fw-semibold mb-0" style={{ color: '#ffffff', marginLeft: '180px' }}>Log out!</h5>
                </div>
            </div>

            <div className="user-role-bar p-3 fw-bold fs-5 flex-shrink-0" style={{ color: 'rgb(4, 38, 80)', background: 'rgba(248, 249, 252, 0.1)' }}>
                User : Faculty
            </div>

            {/* MENU LIST - Scrollable */}
            <ul
                className="sidebar-menu nav nav-pills flex-column mb-0 p-0 list-unstyled overflow-auto flex-grow-1"
                style={{
                    scrollbarWidth: 'thin',
                    minHeight: 0,
                    paddingBottom: '100px' 
                }}
            >
                {/* View statement*/}
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

                

                    {/* Faculty CIS */}





                

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
                                onClick={(e) => { e.stopPropagation(); toggleSubMenu("CIS Entery Direct"); }}
                                style={{ cursor: 'pointer' }}
                            >
                                <span>CIS Entery Direct</span>
                                {openSubMenu === "CIS Entery Direct" ? <FaMinus size={10} /> : <FaPlus size={10} />}

                            </div>

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
                                    <div className="py-1 text-white small cursor-pointer" style={{ cursor: 'pointer' }}>Direct report</div>
                                    <div className="py-1 text-white small cursor-pointer" style={{ cursor: 'pointer' }}>Indirect report</div>
                                </div>
                            )}

                           
                        
                        </div>
                    )}
                </li>

                

                

                {/* Teaching plan */}
                <li className="nav-item">
                    <div className="menu-item nav-link d-flex align-items-center text-white cursor-pointer" style={{ cursor: 'pointer' }}>
                        <FaCircle className="menu-dot me-3" style={{ fontSize: '0.6rem' }} />
                        Teaching plan
                    </div>
                </li>

                {/* Student stres analysis report */}
                <li className="nav-item">
                    <div className="menu-item nav-link d-flex align-items-center text-white cursor-pointer" style={{ cursor: 'pointer' }}>
                        <FaCircle className="menu-dot me-3" style={{ fontSize: '0.6rem' }} />
                        Stress Analysis report
                    </div>
                </li>

                {/* View dac report */}
                <li className="nav-item">
                    <div className="menu-item nav-link d-flex align-items-center text-white cursor-pointer" style={{ cursor: 'pointer' }}>
                        <FaCircle className="menu-dot me-3" style={{ fontSize: '0.6rem' }} />
                        DAC report
                    </div>
                </li>

                

                {/* Templates */}
                <li className="nav-item">
                    <div className="menu-item nav-link d-flex align-items-center text-white cursor-pointer" style={{ cursor: 'pointer' }}>
                        <FaCircle className="menu-dot me-3" style={{ fontSize: '0.6rem' }} />
                        Templates
                    </div>
                </li>
            </ul>
        </div>
    )
}
export default Facside;