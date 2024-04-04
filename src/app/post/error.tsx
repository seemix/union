'use client';
import React, { useEffect } from 'react';
import { VscError } from 'react-icons/vsc';

const ErrorComponent = ({ error }: {
    error: Error & { digest?: string }
}) => {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);
    return (
        <div className={'main'}>
            <div style={{ padding: '20px', border: '1px solid rgb(var(--red))' }}>
                <h2 style={{ color: 'rgb(var(--red))' }}><VscError/> Error </h2>
                <p>{error.message}</p>
            </div>
        </div>
    );
};

export default ErrorComponent;