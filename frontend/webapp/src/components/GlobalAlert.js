import React, { useState, useEffect } from 'react';
import { celebImg } from '../assets/images';

const GlobalAlert = () => {
    const [alertData, setAlertData] = useState({ show: false, message: '', type: 'info' });

    useEffect(() => {
        const handleCustomAlert = (event) => {
            const { message } = event.detail;
            const lowerMsg = message?.toLowerCase() || '';
            let type = 'info';

            if (lowerMsg.includes('success') || lowerMsg.includes('saved') || lowerMsg.includes('approved') || lowerMsg.includes('copied')) {
                type = 'success';
            } else if (lowerMsg.includes('fail') || lowerMsg.includes('error') || lowerMsg.includes('mismatch') || lowerMsg.includes('please') || lowerMsg.includes('invalid')) {
                type = 'error';
            } else {
                // Default to info/warning
                type = 'info';
            }

            setAlertData({ show: true, message, type });
        };

        window.addEventListener('show-custom-alert', handleCustomAlert);

        // Override native window.alert
        const originalAlert = window.alert;
        window.alert = (message) => {
            const event = new CustomEvent('show-custom-alert', { detail: { message: String(message) } });
            window.dispatchEvent(event);
        };

        return () => {
            window.removeEventListener('show-custom-alert', handleCustomAlert);
            window.alert = originalAlert; // Restore on unmount
        };
    }, []);

    const closePopup = () => {
        setAlertData({ ...alertData, show: false });
    };

    if (!alertData.show) return null;

    const isSuccess = alertData.type === 'success';
    const isError = alertData.type === 'error';

    return (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
            <div className="bg-white p-5 rounded shadow d-flex flex-column align-items-center justify-content-center text-center px-4 py-5" style={{ maxWidth: '500px', width: '90%', minHeight: '300px', borderTop: isError ? '6px solid #d32f2f' : '6px solid #1976d2' }}>

                {isSuccess && (
                    <div className="mb-4">
                        <img src={celebImg} alt="Celebration" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
                    </div>
                )}

                {isError && (
                    <div className="mb-4 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px', backgroundColor: '#ffebee', border: '4px solid #f44336', color: '#d32f2f', fontSize: '40px', fontWeight: 'bold' }}>
                        !
                    </div>
                )}

                {!isSuccess && !isError && (
                    <div className="mb-4 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px', backgroundColor: '#e3f2fd', border: '4px solid #2196f3', color: '#1976d2', fontSize: '40px', fontWeight: 'bold' }}>
                        i
                    </div>
                )}

                <h4 className={`mb-4 fw-bold ${isError ? 'text-danger' : 'text-primary'}`} style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                    {alertData.message}
                </h4>

                <button
                    onClick={closePopup}
                    className={`btn px-4 py-2 mt-2 fw-bold`}
                    style={{
                        backgroundColor: isError ? '#d32f2f' : '#1976d2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        minWidth: '130px',
                        fontSize: '16px'
                    }}
                >
                    OK
                </button>
            </div>
        </div>
    );
};

export default GlobalAlert;
