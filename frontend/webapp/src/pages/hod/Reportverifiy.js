import './Reportverifiy.css';

const Reportverifiy = () => {
    // Mock data based on the image
    const reports = [
        { id: 101, name: "DAC report", date: "01-02-2025", submittedBy: "Coordinator", status: "Pending" },
        { id: 102, name: "Direct CIS", date: "20-02-2025", submittedBy: "Faculty", status: "Verified" }, // Corrected spelling from image 'Verifyied' unless strictly requested
        { id: 103, name: "Teacher Feedback", date: "15-06-2025", submittedBy: "Coordinator", status: "Rejected" }
    ];



    return (
        <div className="reportverifiy-wrapper">
            <div className="d-flex">
                <div className="reportverifiy-main">
                    <div className="reportverifiy-card">

                        <h2 className="rv-title">Report Verification</h2>

                        <div className="rv-table-container">
                            <table className="rv-table">
                                <thead>
                                    <tr>
                                        <th>Report ID</th>
                                        <th>Report Name</th>
                                        <th>Submission date</th>
                                        <th>Submitted by</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map((report, index) => (
                                        <tr key={index}>
                                            <td>{report.id}</td>
                                            <td>{report.name}</td>
                                            <td>{report.date}</td>
                                            <td>{report.submittedBy}</td>
                                            <td>{report.status}</td>
                                            <td>
                                                <button className="btn-view">View</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reportverifiy;
