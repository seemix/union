'use client';

import React from 'react';

import { Error } from '@/app/components';

const ErrorComponent = ({ error }: {
    error: Error & { digest?: string }
}) => {
    return (
        <Error message={error.message}/>
    );
};

export default ErrorComponent;