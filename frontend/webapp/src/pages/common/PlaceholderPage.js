import React from 'react';
import { useLocation } from 'react-router-dom';

const PlaceholderPage = ({ title }) => {
    const location = useLocation();
    const pageTitle = title || location.pathname.split('/').pop().replace(/-/g, ' ');

    return (
        <div className="container mt-5 text-center">
            <h1>This is {pageTitle} page</h1>
            <p className="text-muted">This page is under construction.</p>
        </div>
    );
};

export default PlaceholderPage;
