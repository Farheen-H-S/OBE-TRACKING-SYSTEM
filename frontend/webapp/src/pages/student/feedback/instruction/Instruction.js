import 'bootstrap/dist/css/bootstrap.min.css';
import '../../stress/instruction/Instruction.css';
import { note } from '../../../../assets/images';
import { useNavigate, useLocation } from 'react-router-dom';

const Instruction = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const surveyId = location.state?.surveyId;

    const handleStart = () => {
        navigate('/student/feedback/questions', { state: { surveyId } });
    };

    return (
        <div className="container-fluid instruction-container min-vh-100 d-flex flex-column">
            <div className="text-center mt-5 mb-4">
                <h1 className="instruction-title">
                    <span className="mindease-red">Feedback</span>
                    <span className="title-separator"> : </span>
                    <span className="instruction-blue">Instructions</span>
                </h1>
            </div>

            <div className="text-center mb-5 px-3">
                <p className="intro-text">
                    Provide honest feedback for your teachers.<br />
                    Select the option that best describes your agreement with each statement.
                </p>
            </div>

            <div className="how-to-play-wrapper text-center mb-4">
                <h2 className="how-to-play-text">How to fill?</h2>
                <img src={note} alt="Note Icon" className="note-icon" />
            </div>

            <div className="steps-container mb-5 mx-auto">
                <ol className="steps-list">
                    <li>Read each statement about the teacher carefully.</li>
                    <li>Select a rating (1 to 5 stars) for each teacher mentioned.</li>
                    <li>Your identity remains completely anonymous.</li>
                    <li>Click the button below to start the feedback session.</li>
                </ol>
            </div>

            <div className="text-center mb-4">
                <button className="btn btn-primary start-btn" onClick={handleStart}>
                    Let's Start
                </button>
            </div>
        </div>
    );
};

export default Instruction;
