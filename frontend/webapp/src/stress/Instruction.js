import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Instruction.css';
import noteIcon from './note.png'; // Make sure this image exists in the folder

const Instruction = () => {
    return (
        <div className="container-fluid instruction-container min-vh-100 d-flex flex-column align-items-center">

            {/* Header Section */}
            <div className="text-center mt-5 mb-4">
                <h1 className="instruction-title">
                    <span className="mindease-red">MindEase</span> <span className="title-separator">:</span> <span className="instruction-blue">Instructions</span>
                </h1>
            </div>

            {/* Intro Text */}
            <div className="text-center mb-5 px-3">
                <p className="intro-text">
                    To help you reflect on your emotions and assess your<br />
                    stress level through simple & fun instructions....
                </p>
            </div>

            {/* How to play Section */}
            <div className="how-to-play-wrapper mb-4">
                <h2 className="how-to-play-text">How to play?</h2>
                <img src={noteIcon} alt="Note Icon" className="note-icon" />
            </div>

            {/* Steps List */}
            <div className="steps-container mb-5">
                <ol className="steps-list">
                    <li>Read the scenario question displayed on the screen.</li>
                    <li>Choose the one emoji that best matches your immediate feeling or reaction to the scenario.</li>
                    <li>Your choice determines your score and stress level. Keep responding!</li>
                    <li>To start, click the button below: "Let's Start!"</li>
                </ol>
            </div>

            {/* Start Button */}
            <div className="mb-5">
                <button className="btn btn-primary start-btn">Let's Start</button>
            </div>

            {/* Bottom decoration is handled by background image in CSS */}
        </div>
    );
};

export default Instruction;
