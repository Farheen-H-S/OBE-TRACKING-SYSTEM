import 'bootstrap/dist/css/bootstrap.min.css';
import '../../stress/welcome/Welcome.css'; // Re-use stress welcome styles
import { useNavigate, useSearchParams } from 'react-router-dom';

const brain = '/images/brain.png';

const Welcome = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const surveyId = searchParams.get('survey_id');

    const handleStart = () => {
        navigate('/student/feedback/instructions', {
            state: { surveyId }
        });
    };

    return (
        <div className="container-fluid welcome-container min-vh-100 d-flex flex-column align-items-center justify-content-center">
            <div className="text-center mb-4">
                <h1 className="welcome-title mb-0">Teacher Feedback</h1>
            </div>

            <div className="mindease-wrapper mb-5">
                <div className="line"></div>
                <h2 className="mindease-text mb-0">Feedback Hub</h2>
                <div className="line"></div>
            </div>

            <div className="mb-5">
                <img src={brain} alt="Feedback" className="brain-img" />
            </div>

            <div className="mb-5">
                <button className="btn btn-primary btn-lg" onClick={handleStart} disabled={!surveyId}>
                    Start Feedback
                </button>
            </div>

            {!surveyId && <p className="text-danger">Invalid Survey Link</p>}

            <div className="fixed-bottom mb-5 d-flex justify-content-center w-100">
                <p className="footer-text mb-0 section-description">
                    Your feedback helps us improve the quality of education.<br />
                    Share your experience today!
                </p>
            </div>
        </div>
    );
};

export default Welcome;
