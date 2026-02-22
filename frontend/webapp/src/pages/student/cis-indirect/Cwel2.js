import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Cwel2.css';
import redbg from '../../../assets/images/redbg.jpg';

const Cwel2k = () => {
    const navigate = useNavigate();
    return (
        <div className="container-fluid cwel2-container">
            <div className="row">
                <div className="col-md-4 p-0">
                    <img src={redbg} alt="Background Pattern" className="cwel2-bg-image img-fluid" />
                </div>
                <div className="col-md-8 d-flex align-items-center">
                    <h1 className="cwel2-title">
                        Welcome to expert talk feedback on “interview preparation”
                    </h1>
                </div>
            </div>

            <div className="row justify-content-center mt-5">
                <div className="col-md-10">
                    <p className="cwel2-description">
                        This survey helps the department assess how effectively the session contributes to the Program Outcomes (POs) and Program Specific Outcomes (PSOs). Your honest feedback is valuable and will help improve the quality of future expert sessions.
                    </p>

                    <p className="cwel2-instruction mt-5">
                        <span className="text-danger fw-bold">Instruction :</span> Compare the expert talk with each PO & PSO and give a rating from 1 to 3
                    </p>

                    <div className="cwel2-rating-scale mt-4">
                        <p className="fw-bold mb-2">Rating scale :</p>
                        <ul className="list-unstyled">
                            <li><span className="text-danger fw-bold">1</span> – low</li>
                            <li><span className="text-danger fw-bold">2</span> – Medium</li>
                            <li><span className="text-danger fw-bold">3</span> – High</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="d-flex justify-content-end mt-5 pe-5 mb-5">
                <button className="btn cwel2-start-btn" onClick={() => navigate('/student/po-input')}>Start</button>
            </div>
        </div>
    );
};

export default Cwel2k;
