import Layout from "../../components/Layout";
import { FaUser } from "react-icons/fa";
import "./CreateUser.css";

const CreateUser = () => {
    return (
        <Layout role="ADMIN"> {/* Use ADMIN role to get Adminhead + Adminside */}
            <div className="form-wrapper w-100" style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 0" }}>
                <div className="form-header d-flex align-items-center mb-4 ps-1">
                    <div
                        className="form-header-icon d-flex justify-content-center align-items-center rounded-circle text-white me-3"
                        style={{ width: "28px", height: "28px", backgroundColor: "#0277bd" }}
                    >
                        <FaUser size={14} />
                    </div>
                    <h2 className="fs-5 fw-bold m-0" style={{ color: "#1a237e" }}>
                        Enter valid credentials to create new user.
                    </h2>
                </div>

                <div className="user-form-container card border-0 shadow-sm p-5">
                    {/* All your form fields remain the same */}
                    <div className="row mb-3 align-items-center">
                        <label className="col-sm-3 col-form-label fw-bold text-secondary">Enter name of user :</label>
                        <div className="col-sm-9">
                            <input type="text" className="form-control" />
                        </div>
                    </div>

                    <div className="row mb-3 align-items-center">
                        <label className="col-sm-3 col-form-label fw-bold text-secondary">Email id :</label>
                        <div className="col-sm-5">
                            <input type="text" className="form-control" />
                        </div>
                    </div>

                    {/* Other form fields remain unchanged */}

                </div>

                <div className="create-btn-container d-flex justify-content-center mt-4">
                    <button className="btn btn-primary px-5 py-2 fw-semibold" style={{ backgroundColor: "#1976d2" }}>
                        Create
                    </button>
                </div>
            </div>
        </Layout>
    );
};

export default CreateUser;
