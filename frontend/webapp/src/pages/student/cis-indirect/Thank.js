import './Thank.css';

const Thank = () => {
    return (
        <div className="container-fluid thank-container d-flex flex-column align-items-center justify-content-center">
            <h1 className="thank-title mb-5">Thank you..!</h1>
            <p className="thank-message mb-5">
                Your feedback has been<br />
                submitted
            </p>
        </div>
    );
};

export default Thank;
