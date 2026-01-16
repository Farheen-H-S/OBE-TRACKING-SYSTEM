import React from "react";
import Layout from "../../components/Layout";
import { FaUserEdit } from "react-icons/fa";
import "./Updateuser.css";

const Updateuser = () => {
  return (
    <Layout role="ADMIN"> {/* Layout will automatically use Adminhead + Adminside */}
      <div className="form-wrapper w-100" style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 0" }}>
        <div className="form-header d-flex align-items-center mb-4 ps-1">
          <div
            className="form-header-icon d-flex justify-content-center align-items-center rounded-circle text-white me-3"
            style={{ width: "28px", height: "28px", backgroundColor: "#0277bd" }}
          >
            <FaUserEdit size={14} />
          </div>
          <h2 className="fs-5 fw-bold m-0 form-header-title">Make required changes to update user.</h2>
        </div>

        <div className="user-form-container card border-0 shadow-sm p-5">
          <form>
            {/* Name */}
            <div className="row mb-3 align-items-center">
              <label className="col-sm-3 col-form-label fw-bold text-secondary">Enter name of user</label>
              <div className="col-sm-9">
                <input type="text" className="form-control" defaultValue="Khushi Dnyaneshwar Nigal" />
              </div>
            </div>

            {/* Email */}
            <div className="row mb-3 align-items-center">
              <label className="col-sm-3 col-form-label fw-bold text-secondary">Email id :</label>
              <div className="col-sm-6">
                <input type="email" className="form-control" defaultValue="Khushi_stud@gmail.com" />
              </div>
            </div>

            {/* Mobile */}
            <div className="row mb-3 align-items-center">
              <label className="col-sm-3 col-form-label fw-bold text-secondary">Mobile no. :</label>
              <div className="col-sm-6">
                <div className="input-group">
                  <span className="input-group-text">+91</span>
                  <input type="text" className="form-control" maxLength={10} defaultValue="7745062029" />
                </div>
              </div>
            </div>

            {/* Role */}
            <div className="row mb-3 align-items-center">
              <label className="col-sm-3 col-form-label fw-bold text-secondary">Role :</label>
              <div className="col-sm-3">
                <select className="form-select" defaultValue="Faculty">
                  <option>Admin</option>
                  <option>Faculty</option>
                  <option>HOD</option>
                  <option>Coordinator</option>
                </select>
              </div>
            </div>

            {/* Department */}
            <div className="row mb-3 align-items-center">
              <label className="col-sm-3 col-form-label fw-bold text-secondary">Department :</label>
              <div className="col-sm-6">
                <select className="form-select" defaultValue="Computer">
                  <option>Computer</option>
                  <option>Electrical</option>
                  <option>Mechanical</option>
                  <option>Civil</option>
                  <option>Information Technology</option>
                </select>
              </div>
            </div>

            {/* Other form fields (From Year, Joining Date, Username, Password, Profile Photo) remain unchanged */}

          </form>
        </div>

        <div className="update-btn-container d-flex justify-content-center mt-4 mb-4">
          <button type="submit" className="btn btn-primary px-5 py-2 fw-semibold" style={{ backgroundColor: "#1976d2" }}>
            Save changes
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Updateuser;
