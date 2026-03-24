import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaUserEdit, FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../../../../utils/axios";
import { getLoggedInUser, updateLoggedInUser } from "../../../../utils/auth";
import "./Updateuser.css";

const Updateuser = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact_no: '',
    role: '',
    department: '',
    date_of_joining: '',
    username: '',
    password: '',
    is_active: true,
    user_id: null
  });
  const [profilePic, setProfilePic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [roleList, setRoleList] = useState([]);
  const [deptHasHod, setDeptHasHod] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const loggedInUser = getLoggedInUser();
  const isAdmin = (loggedInUser?.role || loggedInUser?.role_name || "").toUpperCase() === 'ADMIN';

  useEffect(() => {
    fetchPrograms();
    fetchRoles();
    const queryParams = new URLSearchParams(location.search);
    let userId = queryParams.get('id');

    // If NOT admin AND userId matches self, use /profile/ endpoint to avoid 403
    if (userId && !isAdmin && String(userId) === String(loggedInUser?.user_id)) {
      userId = "profile";
    }

    if (userId) {
      fetchUser(userId);
    } else if (loggedInUser) {
      fetchUser("profile");
    } else {
      setLoading(false);
    }
  }, [location, isAdmin, loggedInUser?.user_id]);

  // Check HOD conflict whenever role, department, or is_active changes
  useEffect(() => {
    const checkDeptHod = async () => {
      const dept = formData.department;
      const role = formData.role;
      const isActive = formData.is_active;
      const currentUserId = formData.user_id;

      // Only applicable if HOD role selected, dept set, and user is active
      if (!dept || role.toLowerCase() !== 'hod' || !isActive) {
        setDeptHasHod(false);
        return;
      }
      try {
        const res = await api.get('/users/', { params: { role: 'HOD', department: dept, status: 'active' } });
        const results = res.data?.results || res.data || [];
        // Exclude current user from check
        const others = Array.isArray(results) ? results.filter(u => String(u.user_id) !== String(currentUserId)) : [];
        setDeptHasHod(others.length > 0);
      } catch (err) {
        console.warn('Could not check HOD for dept:', err);
        setDeptHasHod(false);
      }
    };
    checkDeptHod();
  }, [formData.role, formData.department, formData.is_active, formData.user_id]);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/users/roles/');
      setRoleList(response.data);
    } catch (err) {
      console.error("Error fetching roles:", err);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await api.get('/academics/programs/');
      setPrograms(response.data);
    } catch (err) {
      console.error("Error fetching programs:", err);
    }
  };

  const fetchUser = async (id) => {
    setLoading(true);
    try {
      const endpoint = id === "profile" ? "/users/profile/" : `/users/${id}/`;
      const response = await api.get(endpoint);
      const userData = response.data;
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        contact_no: userData.contact_no || '',
        role: userData.role_name || '',
        department: userData.department || '',
        date_of_joining: userData.date_of_joining ? (userData.date_of_joining.includes('/') ? userData.date_of_joining.split('/').reverse().join('-') : userData.date_of_joining) : '',
        username: userData.username || userData.email || '',
        password: '', // Don't pre-fill password
        is_active: userData.is_active,
        user_id: userData.user_id // Keep ID for save
      });
    } catch (err) {
      console.error("Error fetching user:", err);
      setError("Failed to fetch user details. You might not have permission.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePic(e.target.files[0]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const queryParams = new URLSearchParams(location.search);
      let userId = queryParams.get('id') || formData.user_id;

      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'password' && !formData[key]) return; // Don't send empty password
        if (key === 'username') {
          data.append(key, formData.email); // Keep username in sync with email
          return;
        }
        if (key === 'user_id') return; // Don't send internal ID
        data.append(key, formData[key]);
      });
      if (profilePic) {
        data.append('profile_picture', profilePic);
      }

      // Map 'role' to 'role_id' if needed - backend view handles role name if passed as 'role'
      data.append('role', formData.role);

      const endpoint = userId ? `/users/${userId}/` : `/users/profile/`;
      const response = await api.put(endpoint, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Sync localStorage if the updated user is the currently logged-in user
      const currentUser = getLoggedInUser();
      const updatedId = userId || currentUser?.user_id || currentUser?.id;
      if (currentUser && String(currentUser.user_id) === String(updatedId)) {
        // Fetch fresh data for storage
        const userResponse = await api.get('/users/profile/');
        updateLoggedInUser(userResponse.data);
      }

      setShowSuccessPopup(true);
    } catch (err) {
      console.error("Error updating user:", err);
      setError(err.response?.data ? JSON.stringify(err.response.data) : "Failed to update user.");
    } finally {
      setSaving(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (loading) return <div className="text-center py-5">Loading user details...</div>;

  return (
    <div className="update-user-container d-flex flex-column h-100 position-relative">
      <main className="form-content-area p-4 d-flex justify-content-center align-items-start overflow-auto w-100" style={{ backgroundColor: '#f0f2f5' }}>
        <div className="form-wrapper w-100" style={{ maxWidth: "900px" }}>
          <div className="form-header d-flex align-items-center justify-content-between mb-4 ps-1">
            <div className="d-flex align-items-center">
              <div className="form-header-icon d-flex justify-content-center align-items-center rounded-circle text-white me-3" style={{ width: "28px", height: "28px", backgroundColor: "#0277bd" }}>
                <FaUserEdit size={14} />
              </div>
              <h2 className="fs-5 fw-bold m-0" style={{ color: '#1a237e' }}>Make required changes to update user.</h2>
            </div>
            <button
              type="button"
              className="btn btn-outline-secondary px-4 fw-bold"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
          </div>

          <div className="user-form-container card border-0 shadow-sm p-5">
            {error && <div className="alert alert-danger mb-4">{error}</div>}

            <form onSubmit={handleSave}>
              {/* Name */}
              <div className="row mb-3 align-items-center">
                <label className="col-sm-3 col-form-label fw-bold text-secondary">Enter name of user</label>
                <div className="col-sm-9">
                  <input type="text" name="name" className="form-control" value={formData.name} onChange={handleInputChange} required />
                </div>
              </div>

              {/* Email */}
              <div className="row mb-3 align-items-center">
                <label className="col-sm-3 col-form-label fw-bold text-secondary">Email id :</label>
                <div className="col-sm-6">
                  <input type="email" name="email" className="form-control" value={formData.email} onChange={handleInputChange} required />
                </div>
              </div>


              {/* Mobile */}
              <div className="row mb-3 align-items-center">
                <label className="col-sm-3 col-form-label fw-bold text-secondary">Mobile no. :</label>
                <div className="col-sm-6">
                  <div className="input-group">
                    <span className="input-group-text bg-light text-secondary fw-medium">+ 91</span>
                    <input type="text" name="contact_no" className="form-control" value={formData.contact_no} onChange={handleInputChange} />
                  </div>
                </div>
              </div>

              {/* Role */}
              <div className="row mb-3 align-items-center">
                <label className="col-sm-3 col-form-label fw-bold text-secondary">Role :</label>
                <div className="col-sm-3">
                  <select name="role" className="form-select" value={formData.role} onChange={handleInputChange} required disabled={!isAdmin}>
                    <option value="" hidden>Select Role</option>
                    {roleList.map(role => (
                      <option key={role.role_id} value={role.role_name}>
                        {role.role_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Department */}
              <div className="row mb-3 align-items-center">
                <label className="col-sm-3 col-form-label fw-bold text-secondary">Department :</label>
                <div className="col-sm-6">
                  <select 
                    name="department" 
                    className="form-select" 
                    value={formData.role.toLowerCase() === 'admin' ? '' : formData.department} 
                    onChange={handleInputChange} 
                    disabled={!isAdmin || formData.role.toLowerCase() === 'admin'}
                  >
                    <option value="" hidden>Select Department</option>
                    {programs.map(prog => (
                      <option key={prog.program_id} value={prog.program_id}>
                        {prog.program_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status / Active */}
              <div className="row mb-3 align-items-center">
                <label className="col-sm-3 col-form-label fw-bold text-secondary">Status :</label>
                <div className="col-sm-9 d-flex flex-column gap-1">
                  <div className="d-flex gap-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="is_active"
                        id="isActive"
                        checked={formData.is_active}
                        onChange={handleInputChange}
                        disabled={!isAdmin || (isAdmin && String(formData.user_id) === String(loggedInUser?.user_id))}
                      />
                      <label className="form-check-label" htmlFor="isActive">Active</label>
                    </div>
                  </div>
                  {deptHasHod && (
                    <small className="text-danger mt-1">
                      <i className="bi bi-exclamation-triangle-fill me-1"></i>
                      This department already has an active HOD. Deactivate the current HOD before saving.
                    </small>
                  )}
                </div>
              </div>


              {/* Date of Joining */}
              <div className="row mb-3 align-items-center">
                <label className="col-sm-3 col-form-label fw-bold text-secondary">Date of Joining :</label>
                <div className="col-sm-3">
                  <input type="date" name="date_of_joining" className="form-control" value={formData.date_of_joining} onChange={handleInputChange} />
                </div>
              </div>

              {/* Password */}
              <div className="row mb-3 align-items-center">
                <label className="col-sm-3 col-form-label fw-bold text-secondary">New Password :</label>
                <div className="col-sm-6">
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className="form-control"
                      placeholder="Leave blank to keep same"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                    <button className="btn btn-outline-secondary" type="button" onClick={togglePasswordVisibility}>
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Photo */}
              <div className="row mb-3 align-items-center">
                <label className="col-sm-3 col-form-label fw-bold text-secondary">Change photo</label>
                <div className="col-sm-9">
                  <input type="file" className="form-control" accept="image/*" onChange={handleFileChange} />
                </div>
              </div>

              <div className="update-btn-container d-flex justify-content-center mt-5">
                <button type="submit" className="btn btn-outline-primary px-5 py-2 shadow-sm fw-bold" disabled={saving || deptHasHod}>
                  {saving ? 'Saving...' : (isAdmin ? 'Save Changes' : 'Update Profile')}
                </button>
                {deptHasHod && (
                  <p className="text-danger text-center mt-2 small">
                    Save disabled: HOD conflict detected for this department.
                  </p>
                )}
              </div>
            </form>
          </div>
        </div >
      </main >

      {/* Success Popup */}
      {
        showSuccessPopup && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="bg-white p-5 rounded shadow d-flex flex-column align-items-center justify-content-center text-center" style={{ maxWidth: '600px', width: '90%' }}>
              <h3 className="mb-4 text-primary fw-bold">User updated successfully!</h3>
              <button
                onClick={() => {
                  const queryId = new URLSearchParams(location.search).get('id');
                  const targetId = queryId || formData.user_id;
                  const currentUser = getLoggedInUser();

                  // If it was the current user, or profile, reload to sync UI
                  if (targetId === 'profile' || (currentUser && String(currentUser.user_id) === String(targetId))) {
                    window.location.href = `/view-user2${targetId !== 'profile' ? `?id=${targetId}` : ''}`;
                  } else {
                    navigate(`/view-user2${targetId ? `?id=${targetId}` : ''}`);
                  }
                }}
                className="btn btn-primary px-4 py-2"
              >
                Back to Profile
              </button>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default Updateuser;
