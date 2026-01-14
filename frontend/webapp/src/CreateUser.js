
import Header from './components/header/Header';
import Adminside from './components/sidebar/Adminside';
import { FaUser } from 'react-icons/fa';
import './CreateUser.css';

const CreateUser = () => {


    return (
        <div className="page-wrapper">
            {/* HEADER */}
            <Header />

            {/* BODY */}
            <div className="page-body">
                {/* SIDEBAR */}
                <Adminside />


                {/* Main Content */}
                <main className="form-content-area">
                    <div className="form-wrapper">

                        <div className="form-header">
                            <div className="form-header-icon">
                                <FaUser />
                            </div>
                            <h2>Enter valid credentials to create new user.</h2>
                        </div>

                        <div className="user-form-container">

                            <div className="form-group">
                                <label className="form-label"> Enter Name :</label>
                                <input type="text" className="form-input" />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email ID :</label>
                                <input type="email" className="form-input underline" />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Mobile No :</label>
                                <div className="mobile-group">
                                    <span className="mobile-prefix">+91</span>
                                    <input type="text" className="mobile-input" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <select className="form-input">
                                    <option>Faculty</option>
                                    <option>HOD</option>
                                    <option>Coordinator</option>
                                    <option>Auditor</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Department</label>
                                <select className="form-input">
                                    <option>Computer</option>
                                    <option>Information Technology</option>
                                    <option>Mechanical</option>
                                    <option>Civil</option>
                                    <option>Electrical</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">From Year :</label>
                                <input type="text" className="form-input small" />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Date of Joining :</label>
                                <input type="text" className="form-input small" placeholder="DD/MM/YYYY" />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Username :</label>
                                <input type="text" className="form-input" />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Password :</label>
                                <input type="password" className="form-input" />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Profile Photo</label>
                                <button className="upload-btn">Upload</button>
                            </div>

                        </div>

                        <div className="create-btn-container">
                            <button className="create-btn">Create</button>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
};

export default CreateUser;
