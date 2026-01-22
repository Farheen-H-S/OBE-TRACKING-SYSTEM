import React, { useState } from 'react';
import './Co1.css';

const Co1 = () => {
    const [selectedOption, setSelectedOption] = useState(null);

    const handleOptionChange = (option) => {
        setSelectedOption(option);
    };

    return (
        <div className="container-fluid co1-container d-flex flex-column align-items-center justify-content-start pt-5">
            <div className="co1-content">
                <h2 className="text-center co1-title mb-5">CO 1</h2>

                <p className="co1-question mb-4">
                    Are you able to develop a program using java classes & objects
                </p>

                <div className="co1-options mb-5 ps-1">
                    {[1, 2, 3, 4].map((number) => (
                        <div key={number} className="form-check mb-3">
                            <input
                                className="form-check-input co1-radio-input"
                                type="radio"
                                name="co1-options"
                                id={`option-${number}`}
                                checked={selectedOption === number}
                                onChange={() => handleOptionChange(number)}
                            />
                            <label className="form-check-label ms-1 co1-option-text" htmlFor={`option-${number}`}>
                                {number}
                            </label>
                        </div>
                    ))}
                </div>

                <div className="d-flex justify-content-center">
                    <button className="btn btn-danger px-4 co1-btn">Next</button>
                </div>
            </div>
        </div>
    );
};

export default Co1;
