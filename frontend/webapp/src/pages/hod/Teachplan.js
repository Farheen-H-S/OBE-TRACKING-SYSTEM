
import React, { useState } from 'react';
import Header from '../components/header/Header';
import Sidebar from '../components/sidebar/Sidebar';
import './Teachplan.css';

const Teachplan = () => {
    const [planData, setPlanData] = useState([
        {
            lectureNo: "1",
            date: "01/12/25",
            topics: "Unit 1: Introduction to AI & ML\n1.1 Introduction of AI: Concept, Scope of AI, Types of AI, Applications of AI",
            completed: "Y"
        },
        {
            lectureNo: "2",
            date: "06/12/25",
            topics: "1.2 Machine Learning: Concept, Types: Supervised, Unsupervised, Reinforcement, Applications of Machine Learning, Concept of Deep Learning, Applications of Deep Learning, Concept of Neural Network, Difference between AI, ML and DL",
            completed: "Y"
        },
        {
            lectureNo: "3",
            date: "20/12/25",
            topics: "1.3 Generative AI: Concept, Transformers: Key components of Transformers: Self-attention mechanism, multi-head attention, Positional encoding, Feed forward Neural Network, Layer Normalization",
            completed: "N"
        },
        {
            lectureNo: "4",
            date: "25/12/25",
            topics: "1.3 Encoder Decoder Structure, Types of Generative AI: Text Generation, Image Generation, Music and Audio Generation, Video Generation, Applications of Generative AI",
            completed: ""
        },
        {
            lectureNo: "5",
            date: "01/01/26",
            topics: "1.4 AI & ML in Digital security: Types of attacks: AI Powered cyber-attack, Adversarial AI attacks, Evasion AI Attack, AI poisoning attack.",
            completed: ""
        }
    ]);

    const handleInputChange = (index, field, value) => {
        const newData = [...planData];
        newData[index][field] = value;
        setPlanData(newData);
    };

    const handleAddRow = () => {
        setPlanData([
            ...planData,
            {
                lectureNo: String(planData.length + 1),
                date: "",
                topics: "",
                completed: ""
            }
        ]);
    };

    return (
        <div className="teachplan-wrapper">
            <Header />
            <div className="d-flex" style={{ flexGrow: 1, overflow: 'hidden' }}>
                <Sidebar />
                <div className="teachplan-content-main">
                    <div className="teachplan-card">

                        <div className="table-responsive">
                            <table className="teachplan-table">
                                <thead>
                                    <tr>
                                        <th className="col-lecture">Lecture no.</th>
                                        <th className="col-date">Date</th>
                                        <th className="col-topics">Topics planned</th>
                                        <th className="col-completed">Completed<br />Yes(C)/NO (N)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {planData.map((row, index) => (
                                        <tr key={index}>
                                            <td className="col-lecture">
                                                <input
                                                    type="text"
                                                    className="editable-input text-center"
                                                    value={row.lectureNo}
                                                    onChange={(e) => handleInputChange(index, 'lectureNo', e.target.value)}
                                                />
                                            </td>
                                            <td className="col-date">
                                                <input
                                                    type="text"
                                                    className="editable-input text-center"
                                                    value={row.date}
                                                    onChange={(e) => handleInputChange(index, 'date', e.target.value)}
                                                />
                                            </td>
                                            <td className="col-topics">
                                                <textarea
                                                    className="editable-textarea"
                                                    value={row.topics}
                                                    onChange={(e) => handleInputChange(index, 'topics', e.target.value)}
                                                />
                                            </td>
                                            <td className="col-completed">
                                                <input
                                                    type="text"
                                                    className="editable-input text-center font-weight-bold"
                                                    value={row.completed}
                                                    onChange={(e) => handleInputChange(index, 'completed', e.target.value)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="text-center mt-3">
                                <button className="btn btn-primary" onClick={handleAddRow}>
                                    + Add New Row
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Teachplan;
