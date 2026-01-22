import React, { useState } from 'react';
import './POinput.css';

const POinput = () => {
    // Initialize state for ratings
    const [ratings, setRatings] = useState({
        PO1: '', PO2: '', PO3: '', PO4: '', PO5: '', PO6: '', PO7: '',
        PSO1: '', PSO2: '', PSO3: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setRatings({ ...ratings, [name]: value });
    };

    const handleSubmit = () => {
        console.log('Submitted Ratings:', ratings);
        // Add submit logic here
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
                                <td className="text-center align-middle">{row.label}</td>
                                <td className="p-0">
                                    <input
                                        type="text"
                                        className="form-control po-input shadow-none"
                                        name={row.name}
                                        value={ratings[row.name]}
                                        onChange={handleInputChange}
                                    />
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
