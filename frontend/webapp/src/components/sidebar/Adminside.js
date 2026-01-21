import React, { useState } from 'react';
import './Adminside.css';
import { FaCircle, FaMinus, FaPlus } from 'react-icons/fa';
import Pofile from '../../admin/profile.jpeg';

import { useNavigate, Link } from 'react-router-dom';

const Adminside = () => {
    const navigate = useNavigate();

    // STATE FOR SIDEBAR TOGGLE
    const [openMenu, setOpenMenu] = useState(null);

    const toggleMenu = (menu) => {
        setOpenMenu(openMenu === menu ? null : menu);
    };

    return (
        <div className="sidebar d-flex flex-column flex-shrink-0 text-white">

            <div className="user-banner p-3 text-center">
                <div className="user-banner-img mb-2">
                    <img src={Pofile} alt="profile pic" className="rounded-circle border border-3 border-white" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                </div>
                <div className="user-banner-info">
                    <h3 className="fs-3.5 bold-0" style={{ color: '#0e2344' }}>Welcome Mitesh!</h3>
                    <p className="fs-5 fw-bold mb-0" style={{ color: '#0e2344' }}>312023016</p>
                    <h5 className="fw-semibold mb-0" style={{ color: '#ffffff', marginLeft: '180px' }}>Log out!</h5>

                </div>
            </div>

            <div className="user-role-bar p-3 fw-bold fs-5" style={{ color: 'rgb(4, 38, 80)', background: 'rgba(248, 249, 252, 0.1)' }}>
                User : Admin
            </div>

            {/* MENU */}
            <ul className="sidebar-menu nav nav-pills flex-column mb-auto p-0 list-unstyled">
                {/* user management */}
                <li className="nav-item">
                    <div className="menu-item nav-link d-flex align-items-center text-white cursor-pointer" onClick={() => toggleMenu("User Management")} style={{ cursor: 'pointer' }}>
                        <FaCircle className="menu-dot me-3" style={{ fontSize: '0.6rem' }} />
                        <span className="flex-grow-1">User Management</span>
                        {openMenu === "User Management" ? <FaMinus /> : <FaPlus />}
                    </div>

                    {openMenu === "User Management" && (
                        <div className="submenu ps-5 bg-black bg-opacity-10 w-100">
                            <Link to="/admin-dash/create-user" className="text-decoration-none text-white">
                                <div className="py-2 cursor-pointer" style={{ cursor: 'pointer' }}>Create User</div>
                            </Link>
                            
                            <Link to="/admin-dash/view-user1" className="text-decoration-none text-white">
                              <div className="py-2 text-white cursor-pointer" style={{ cursor: 'pointer' }}>View User</div> 
                            </Link>
                        </div>
                    )}
                </li>


                <li className="nav-item">
                    <div className="menu-item nav-link d-flex align-items-center text-white cursor-pointer" style={{ cursor: 'pointer' }}>
                    
                        <FaCircle className="menu-dot me-3" style={{ fontSize: '0.6rem' }} />
                        <Link to="/admin-dash/currentset" className="text-decoration-none text-white">
                                <div className="py-2 cursor-pointer" style={{ cursor: 'pointer' }}>Acedemic setup</div>
                            </Link>
                        
                    </div>
                </li>


                <li className="nav-item">
                    <div className="menu-item nav-link d-flex align-items-center text-white cursor-pointer" style={{ cursor: 'pointer' }} >
                        <FaCircle className="menu-dot me-3" style={{ fontSize: '0.6rem' }} />
                        <Link to="/admin-dash/auditlog" className="text-decoration-none text-white">
                                <div className="py-2 cursor-pointer" style={{ cursor: 'pointer' }}>Audit Log</div>
                            </Link>
                        
                    </div>
                </li>


            </ul>
        </div>
    )
}
export default Adminside;