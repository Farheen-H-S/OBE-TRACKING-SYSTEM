import 'bootstrap/dist/css/bootstrap.min.css';
import './Welcome.css';
import { brain, bubble } from '../../../../assets/images';
import { useNavigate } from 'react-router-dom';

const Welcome = () => {
    const navigate = useNavigate();

    const handleStart = () => {
        navigate('/stress/instructions', {
            state: { surveyId: 2 } // hardcoded for now
        });
    };

    return (
        <div className="container-fluid welcome-container min-vh-100 d-flex flex-column align-items-center justify-content-center" style={{ backgroundImage: `url(${bubble})` }}>
            <div className="text-center mb-4">
                <h1 className="welcome-title mb-0">Welcome</h1>
            </div>

            <div className="mindease-wrapper mb-5">
                <div className="line"></div>
                <h2 className="mindease-text mb-0">MindEase</h2>
                <div className="line"></div>
            </div>

            <div className="mb-5">
                <img src={brain} alt="Smiling Brain" className="brain-img" />
            </div>

            <div className="mb-5">
                <button className="btn btn-primary btn-lg" onClick={handleStart}>
                    Start
                </button>
            </div>

            <div className="fixed-bottom mb-5 d-flex justify-content-center w-100">
                <p className="footer-text mb-0 section-description">
                    Take a quick journey to understand how you’re<br />
                    feeling today !....
                </p>
            </div>
        </div>
    );
};

export default Welcome;
