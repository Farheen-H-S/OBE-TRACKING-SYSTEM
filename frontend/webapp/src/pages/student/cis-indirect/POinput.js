import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './POinput.css';

const POinput = () => {
    // Initialize state for ratings
    const [ratings, setRatings] = useState({
        PO1: '', PO2: '', PO3: '', PO4: '', PO5: '', PO6: '', PO7: '',
        PSO1: '', PSO2: '', PSO3: ''
    });
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setRatings({ ...ratings, [name]: value });
    };

    const handleSubmit = () => {
        console.log('Submitted Ratings:', ratings);
        navigate('/student/thank-you');
    };

    const rows = [
        { label: 'PO 1', name: 'PO1' },
        { label: 'PO 2', name: 'PO2' },
        { label: 'PO 3', name: 'PO3' },
        { label: 'PO 4', name: 'PO4' },
        { label: 'PO 5', name: 'PO5' },
        { label: 'PO 6', name: 'PO6' },
        { label: 'PO 7', name: 'PO7' },
        { label: 'PSO 1', name: 'PSO1' },
        { label: 'PSO 2', name: 'PSO2' },
        { label: 'PSO 3', name: 'PSO3' },
    ];

    return (
        <div className="container-fluid po-container d-flex flex-column align-items-center justify-content-center">
            <div className="po-table-wrapper">
                <table className="table table-bordered po-table">
                    <thead>
                        <tr>
                            <th className="po-header text-center">PO's & PSO's nos.</th>
                            <th className="po-header text-center">Rating</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={index}>
                                <td className="text-center align-middle fw-bold" style={{ backgroundColor: '#f8f9fa', width: '30%' }}>{row.label}</td>
                                <td className="p-0 align-middle">
                                    <div className="d-flex justify-content-around align-items-center py-2 px-3 h-100">
                                        {[1, 2, 3].map(val => (
                                            <label key={val} className="d-flex align-items-center cursor-pointer mb-0 radio-pill-label">
                                                <input
                                                    type="radio"
                                                    name={row.name}
                                                    value={val}
                                                    checked={ratings[row.name] === val.toString()}
                                                    onChange={handleInputChange}
                                                    className="me-2 cursor-pointer custom-radio"
                                                />
                                                <span className="fw-bold">{val}</span>
                                            </label>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-4">
                <button className="btn po-submit-btn" onClick={handleSubmit}>Submit</button>
            </div>
        </div>
    );
};

export default POinput;
