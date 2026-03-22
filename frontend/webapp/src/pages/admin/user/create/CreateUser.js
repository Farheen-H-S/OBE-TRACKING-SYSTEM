import { FaUser, FaEye, FaEyeSlash, FaUpload } from 'react-icons/fa';
import './CreateUser.css';
import React, { useState, useEffect } from 'react';
import { celebImg } from '../../../../assets/images';
import api from '../../../../utils/axios';
import { useNavigate } from 'react-router-dom';

const CreateUser = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        contact_no: '',
        role: '',
        department: '',
        date_of_joining: new Date().toISOString().split('T')[0], // YYYY-MM-DD for date input
        username: '',
        password: '',
        is_active: true,
    });
    const [profilePic, setProfilePic] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [createdUsername, setCreatedUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkFile, setBulkFile] = useState(null);
    const [bulkResults, setBulkResults] = useState(null);
    const [programs, setPrograms] = useState([]);
    const [roleList, setRoleList] = useState([]);
    const [deptHasHod, setDeptHasHod] = useState(false);

    useEffect(() => {
        fetchPrograms();
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const response = await api.get('/users/roles/');
            setRoleList(response.data);
        } catch (err) {
            console.error('Error fetching roles:', err);
        }
    };

    const fetchPrograms = async () => {
        try {
            const response = await api.get('/academics/programs/');
            setPrograms(response.data);
        } catch (err) {
            console.error('Error fetching programs:', err);
        }
    };

    // Auto-populate username when email changes
    useEffect(() => {
        setFormData(prev => ({ ...prev, username: prev.email }));
    }, [formData.email]);

    // Check if selected department already has an active HOD
    useEffect(() => {
        const checkDeptHod = async () => {
            const dept = formData.department;
            if (!dept) {
                setDeptHasHod(false);
                return;
            }
            try {
                const res = await api.get('/users/', { params: { role: 'HOD', department: dept, status: 'active' } });
                const results = res.data?.results || res.data || [];
                const hasHod = Array.isArray(results) && results.length > 0;
                setDeptHasHod(hasHod);
                // Clear HOD selection if conflict detected
                if (hasHod && formData.role.toLowerCase() === 'hod') {
                    setFormData(prev => ({ ...prev, role: '' }));
                }
            } catch (err) {
                console.warn('Could not check HOD for dept:', err);
                setDeptHasHod(false);
            }
        };
        checkDeptHod();
    }, [formData.department]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setProfilePic(e.target.files[0]);
        }
    };

    const handleCreate = async () => {
        setLoading(true);
        setError('');
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                data.append(key, formData[key]);
            });
            if (profilePic) {
                data.append('profile_picture', profilePic);
            }

            // The backend expect 'role_id' or 'role' name based on views logic
            // The view handles 'role' name to 'role_id' conversion if 'role' is passed in data

            const response = await api.post('/users/', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 201) {
                setCreatedUsername(formData.username || response.data.user_id);
                setShowPopup(true);
            }
        } catch (err) {
            console.error('Error creating user:', err);
            setError(err.response?.data ? JSON.stringify(err.response.data) : 'Failed to create user. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const closePopup = () => {
        setShowPopup(false);
        navigate('/view-user');
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="create-user-container d-flex flex-column h-100 position-relative">
            <main className="form-content-area p-4 d-flex justify-content-center align-items-start overflow-auto w-100" style={{ backgroundColor: '#f0f2f5' }}>
                <div className="form-wrapper w-100" style={{ maxWidth: '900px' }}>
                    <div className="form-header d-flex align-items-center justify-content-between mb-4 ps-1">
                        <div className="d-flex align-items-center">
                            <div className="form-header-icon d-flex justify-content-center align-items-center rounded-circle text-white me-3" style={{ width: '28px', height: '28px', backgroundColor: '#0277bd' }}>
                                <FaUser size={14} />
                            </div>
                            <h2 className="fs-5 fw-bold m-0" style={{ color: '#1a237e' }}>Enter valid credentials to create new user.</h2>
                        </div>

                    </div>

                    <div className="user-form-container card border-0 shadow-sm p-5">
                        {error && <div className="alert alert-danger mb-4">{error}</div>}

                        <div className="row mb-3 align-items-center ">
                            <label className="col-sm-3 col-form-label fw-bold text-secondary">Enter name of the user :</label>
                            <div className="col-sm-9">
                                <input type="text" name="name" className="form-control" value={formData.name} onChange={handleInputChange} />
                            </div>
                        </div>

                        <div className="row mb-3 align-items-center">
                            <label className="col-sm-3 col-form-label fw-bold text-secondary">Email :</label>
                            <div className="col-sm-5">
                                <input type="email" name="email" className="form-control" value={formData.email} onChange={handleInputChange} />
                            </div>
                        </div>

                        <div className="row mb-3 align-items-center">
                            <label className="col-sm-3 col-form-label fw-bold text-secondary">Contact :</label>
                            <div className="col-sm-5">
                                <div className="input-group">
                                    <span className="input-group-text bg-light text-secondary fw-medium">+ 91</span>
                                    <input type="text" name="contact_no" className="form-control" value={formData.contact_no} onChange={handleInputChange} />
                                </div>
                            </div>
                        </div>

                        <div className="row mb-3 align-items-center">
                            <label className="col-sm-3 col-form-label fw-bold text-secondary">Role :</label>
                            <div className="col-sm-3">
                        <select name="role" className="form-select" value={formData.role} onChange={handleInputChange}>
                                    <option value="" hidden>Select Role</option>
                                    {roleList.map(role => (
                                        <option
                                            key={role.role_id}
                                            value={role.role_name}
                                            disabled={role.role_name.toLowerCase() === 'hod' && deptHasHod}
                                            title={role.role_name.toLowerCase() === 'hod' && deptHasHod ? 'This department already has an active HOD' : ''}
                                        >
                                            {role.role_name}{role.role_name.toLowerCase() === 'hod' && deptHasHod ? ' (Occupied)' : ''}
                                        </option>
                                    ))}
                                </select>
                                {deptHasHod && formData.department && (
                                    <small className="text-warning mt-1 d-block">
                                        <i className="bi bi-exclamation-triangle-fill me-1"></i>
                                        This department already has an active HOD. HOD role is unavailable.
                                    </small>
                                )}
                            </div>
                        </div>

                        <div className="row mb-3 align-items-center">
                            <label className="col-sm-3 col-form-label fw-bold text-secondary">Department :</label>
                            <div className="col-sm-5">
                                <select name="department" className="form-select" value={formData.department} onChange={handleInputChange}>
                                    <option value="" hidden> Select Department</option>
                                    {programs.map(prog => (
                                        <option key={prog.program_id} value={prog.program_id}>
                                            {prog.program_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="row mb-3 align-items-center">
                            <label className="col-sm-3 col-form-label fw-bold text-secondary">Date of Joining :</label>
                            <div className="col-sm-3">
                                <input type="date" name="date_of_joining" className="form-control" value={formData.date_of_joining} onChange={handleInputChange} />
                            </div>
                        </div>

                        <div className="row mb-3 align-items-center">
                            <label className="col-sm-3 col-form-label fw-bold text-secondary">Username :</label>
                            <div className="col-sm-3">
                                <input type="text" name="username" className="form-control" value={formData.username} onChange={handleInputChange} />
                            </div>
                        </div>

                        <div className="row mb-3 align-items-center">
                            <label className="col-sm-3 col-form-label fw-bold text-secondary">Password :</label>
                            <div className="col-sm-6">
                                <div className="input-group">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        className="form-control"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                    />
                                    <button
                                        className="btn btn-outline-secondary"
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="row mb-3 align-items-center">
                            <label className="col-sm-3 col-form-label fw-bold text-secondary">Profile Photo</label>
                            <div className="col-sm-9">
                                <input type="file" className="form-control" accept="image/*" onChange={handleFileChange} />
                            </div>
                        </div>
                    </div>

                    <div className="create-btn-container d-flex justify-content-center mt-4 mb-4">
                        <button
                            onClick={handleCreate}
                            className="btn btn-outline-primary px-5 py-2 fw-bold shadow-sm"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </div>
            </main>

            {/* Success Popup */}
            {showPopup && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="bg-white p-5 rounded shadow d-flex flex-column align-items-center justify-content-center text-center" style={{ maxWidth: '700px', width: '90%', minHeight: '400px' }}>
                        <h3 className="mb-4 text-primary fw-bold" style={{ color: '#3f51b5' }}>New user with username {createdUsername} has successfully created</h3>
                        <div className="mb-4">
                            <img src={celebImg} alt="Celebration" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
                        </div>
                        <button onClick={closePopup} className="btn btn-primary px-4 py-2" style={{ backgroundColor: '#4285f4', border: 'none', borderRadius: '4px' }}>OK</button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CreateUser;

