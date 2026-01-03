import React from "react";
import Header from "./components/header/Header";
import Sidebar from "./components/sidebar/Sidebar";
import "./Updateuser.css";

const Updateuser = () => {
  return (
    <div className="page-wrapper">
      {/* HEADER */}
      <Header />

      {/* BODY */}
      <div className="page-body">
        {/* SIDEBAR */}
        <Sidebar />

        {/* MAIN CONTENT */}
        <div className="content-wrapper">
          <div className="white-container">
            <h3 className="form-title">
              <span className="user-icon">👤</span>
              Make required changes to update user.
            </h3>

            <form className="update-form">
              <label>Enter name of user</label>
              <input type="text" defaultValue="Khushi Dnyaneshwar Nigal" />

              <label>Email id :</label>
              <input type="email" defaultValue="Khushi_stud@gmail.com" disabled />

              <label>Mobile no. :</label>
              <input type="text" defaultValue="+91 7745062029" />

              <label>Role :</label>
              <select defaultValue="Faculty">
                <option>Admin</option>
                <option>HO0</option>
                <option>Coordinator</option>

              </select>

              <label>Department :</label>
              <select defaultValue="Computer">
                <option>Electrical</option>
                <option>Mechanical</option>
                <option>Civil</option>
                <option>Information Technology</option>
                
              </select>

              <label>From Year :</label>
              <input type="text" defaultValue="2025" />

              <label>Date of Joining :</label>
              <input type="text" defaultValue="01/02/2022" />

              <label>Username :</label>
              <input type="text" defaultValue="312023046" />

              <label>Password :</label>
              <input type="password" defaultValue="3ji200" />

              <label>Profile photo</label>
              <button type="button" className="upload-btn">
                Upload
              </button>

              <div className="form-footer">
                <button type="submit" className="save-btn">
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Updateuser;
