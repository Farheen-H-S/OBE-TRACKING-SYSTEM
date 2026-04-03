import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../view/Viewuser1.css';
import { FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import api from '../../../../utils/axios';

const profile = '/images/profile.jpeg';

const Viewuser1 = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/users/?search=${search}&page=${page}`);
      setUsers(response.data.results);
      setTotalPages(Math.ceil(response.data.count / 10)); // Assuming 10 per page
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      setPage(1);
      fetchUsers();
    }
  };

  const handleUserClick = (userId) => {
    // Navigate to details page with ID
    navigate(`/view-user2?id=${userId}`);
  };

  return (
    <div className="view-user-container p-4" style={{ backgroundColor: '#f0f2f5', minHeight: '100%' }}>
      <div className="form-wrapper w-100 mx-auto" style={{ maxWidth: '1050px' }}>
        <h5 className="fw-medium text-primary mb-4 fs-3 inter-heading">Search User</h5>

        <div className="d-flex gap-3 mb-4">
          <div className="position-relative flex-grow-1" style={{ maxWidth: "400px" }}>
            <FaSearch className="position-absolute translate-middle-y top-50 ms-3 text-secondary" />
            <input
              type="text"
              className="form-control ps-5 fs-5 py-2 shadow-sm"
              placeholder="Search by name, email or contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
          <button className="btn btn-outline-primary px-4 shadow-sm fw-bold" onClick={() => { setPage(1); fetchUsers(); }}>Search</button>
        </div>

        <div className="card border-0 shadow-sm overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Profile</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Contact</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="text-center py-5">Loading...</td></tr>
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.user_id} onClick={() => handleUserClick(user.user_id)} style={{ cursor: 'pointer' }}>
                      <td className="ps-4">
                        <img
                          src={user.profile_picture ? (user.profile_picture.startsWith('http') ? user.profile_picture : `http://127.0.0.1:8000${user.profile_picture}`) : profile}
                          alt=""
                          className="rounded-circle shadow-sm"
                          style={{ width: '38px', height: '38px', objectFit: 'cover', border: '2px solid #fff' }}
                        />
                      </td>
                      <td className="fw-medium">{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role_name}</td>
                      <td>{user.department_name || 'N/A'}</td>
                      <td>{user.contact_no || 'N/A'}</td>
                      <td className="text-center">
                        <span className={`badge ${user.is_active ? 'bg-success' : 'bg-danger'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="7" className="text-center py-5 text-muted">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div className="text-muted small">
            Page {page} of {totalPages || 1}
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-primary d-flex align-items-center gap-1 shadow-sm"
              disabled={page === 1 || loading}
              onClick={() => setPage(p => p - 1)}
            >
              <FaChevronLeft size={12} /> Previous
            </button>
            <button
              className="btn btn-outline-primary d-flex align-items-center gap-1 shadow-sm"
              disabled={page === totalPages || loading || totalPages === 0}
              onClick={() => setPage(p => p + 1)}
            >
              Next <FaChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Viewuser1;
