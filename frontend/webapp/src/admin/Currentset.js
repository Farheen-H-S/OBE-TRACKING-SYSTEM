
import '../admin/Currentset.css';
import Adminhead from '../components/header/Adminhead';
import Adminside from '../components/sidebar/Adminside';

const Currentset = () => {
    return (
        <div className="create-user-container d-flex flex-column min-vh-100 overflow-hidden">
            {/* Header - Full Width */}
            <Adminhead />

            {/* Body - Sidebar + Content */}
            <div className="d-flex flex-grow-1 overflow-hidden">
                {/* Sidebar */}
                <Adminside />

                {/* Main Content */}
                <main className="flex-grow-1 p-4 d-flex justify-content-center align-items-start overflow-auto" style={{ backgroundColor: '#f0f2f5' }}>

                    <div className="bg-white p-5 rounded shadow-sm w-100" style={{ maxWidth: '800px', marginTop: '50px' }}>

                        <form>
                            {/* Year */}
                            <div className="row mb-4 align-items-center">
                                <label className="col-sm-3 col-form-label fs-5 fw-bold" style={{ color: '#1a237e' }}>Year :</label>
                                <div className="col-sm-6">
                                    <select className="form-select border-secondary" style={{ borderRadius: '2' }}>
                                        <option>2025 - 26</option>
                                        <option>2024 - 25</option>
                                        <option>2023 - 24</option>
                                    </select>
                                </div>
                            </div>

                            {/* Scheme */}
                            <div className="row mb-4 align-items-center">
                                <label className="col-sm-3 col-form-label fs-5 fw-bold" style={{ color: '#1a237e' }}>Scheme :</label>
                                <div className="col-sm-6">
                                    <select className="form-select border-secondary" style={{ borderRadius: '2' }}>
                                        <option>K</option>
                                        <option>I</option>
                                    </select>
                                </div>
                            </div>

                            {/* Semester */}
                            <div className="row mb-5 align-items-center">
                                <label className="col-sm-3 col-form-label fs-5 fw-bold" style={{ color: '#1a237e' }}>Semester :</label>
                                <div className="col-sm-6">
                                    <select className="form-select border-secondary" style={{ borderRadius: '0' }}>
                                        <option>Odd</option>
                                        <option>Even</option>
                                    </select>
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="row justify-content-center">
                                <div className="col-auto">
                                    <button type="button" className="btn btn-primary px-4 py-2 fs-6 fw-semibold" style={{ backgroundColor: '#4285f4', borderRadius: '4px', minWidth: '100px' }}>
                                        Save
                                    </button>
                                </div>
                            </div>

                        </form>
                    </div>

                </main>
            </div>
        </div>
    );
};

export default Currentset;
