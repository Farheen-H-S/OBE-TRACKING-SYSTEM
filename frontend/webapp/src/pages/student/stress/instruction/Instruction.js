import 'bootstrap/dist/css/bootstrap.min.css';
import './Instruction.css';
import { note } from '../../../assets/images';
import { useNavigate, useLocation } from 'react-router-dom';

const Instruction = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const surveyId = location.state?.surveyId || 2;

    const handleStart = () => {
        navigate('/stress/questions', { state: { surveyId } });
    };

    return (
        <div className="container-fluid instruction-container min-vh-100 d-flex flex-column">
            <div className="text-center mt-5 mb-4">
                <h1 className="instruction-title">
                    <span className="mindease-red">MindEase</span>
                    <span className="title-separator"> : </span>
                    <span className="instruction-blue">Instructions</span>
                </h1>
            </div>

            <div className="text-center mb-5 px-3">
                <p className="intro-text">
                    To help you reflect on your emotions and assess your
                    <br />
                    stress level through simple & fun instructions....
                </p>
            </div>

            <div className="how-to-play-wrapper text-center mb-4">
                <h2 className="how-to-play-text">How to play?</h2>
                <img src={note} alt="Note Icon" className="note-icon" />
            </div>

            <div className="steps-container mb-5 mx-auto">
                <ol className="steps-list">
                    <li>Read the scenario question displayed on the screen.</li>
                    <li>Choose the one emoji that best matches your immediate feeling.</li>
                    <li>Your choice determines your score and stress level.</li>
                    <li>Click the button below to begin.</li>
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
