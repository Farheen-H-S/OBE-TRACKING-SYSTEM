import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../stress/exit/Exit.css';
import { brain } from '../../../../assets/images';

const Exit = () => {
    const navigate = useNavigate();
    const { state } = useLocation();

    const surveyName = state?.surveyName || "Teacher Feedback";

    useEffect(() => {
        if (!state || !state.surveyId) {
            navigate('/student/feedback/welcome');
        }
    }, [state, navigate]);

    return (
        <div className="container-fluid exit-container">
            <div className="text-center mt-4 mb-3">
                <div className="logo-wrapper">
                    <img src={brain} alt="Success" className="brain-logo" />
                    <span className="mindease-logo-text">Feedback Hub</span>
                </div>
            </div>

            <div className="text-center mb-5 title-section">
                <h6 className="mission-title mb-2">{surveyName} :</h6>
                <h6 className="mission-completed">Thank You !!</h6>
            </div>

            <div className="text-center mb-5">
                <div className="emoji-medium">🌟</div>
                <h2 className="mood-text">Feedback Submitted</h2>
            </div>

            <div className="text-center mb-5 score-section">
                <p className="fs-5 text-muted px-4">
                    Your assessment has been recorded successfully.
                    We appreciate your time and honest input.
                </p>
            </div>
        </div>
    );
};

export default Exit;
