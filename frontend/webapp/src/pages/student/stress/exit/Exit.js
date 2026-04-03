import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Exit.css';
const brain = '/images/brain.png';

const Exit = () => {
    const navigate = useNavigate();
    const { state } = useLocation();

    const [score, setScore] = useState(null);
    const [category, setCategory] = useState('');
    const [emoji, setEmoji] = useState('😌');
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        if (!state || !state.result) {
            navigate('/stress/welcome');
            return;
        }

        const { result } = state;
        setScore(result.stress_percentage);
        setCategory(result.label);
        setEmoji(result.emoji);
    }, [state, navigate]);

    const handleExit = () => setCompleted(true);

    if (score === null) return <p>Loading results...</p>;

    return (
        <div className="container-fluid exit-container">
            <div className="text-center mt-1 mb-2">
                <div className="logo-wrapper">
                    <img src={brain} alt="Brain Mascot" className="brain-logo" />
                    <span className="mindease-logo-text">MindEase</span>
                </div>
            </div>

            <div className="text-center mb-4 title-section">
                <h6 className="mission-title mb-2">Stress Check mission :</h6>
                <h6 className="mission-completed">Completed !!</h6>
            </div>

            <div className="text-center mb-4">
                <div className="emoji-medium">{emoji}</div>
                <h2 className="mood-text">{category}</h2>
            </div>

            <div className="text-center mb-4 score-section">
                <h3 className="score-text">Overall score : {score}</h3>
                <h3 className="category-text">Category : {category}</h3>
            </div>

            <div className="exit-message-container text-center px-4">
                {score > 70 ? (
                    <p className="text-muted fs-5">
                        Please take a short break and talk to someone you trust.
                    </p>
                ) : score > 30 ? (
                    <p className="text-muted fs-5">
                        Take small breaks and do one task at a time.
                    </p>
                ) : (
                    <p className="text-muted fs-5">
                        You are doing well. Continue your routine.
                    </p>
                )}
            </div>
        </div>
    );
};

export default Exit;