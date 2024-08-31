'use client';
import React from 'react';
import { FacebookShare } from 'react-share-kit';
import { usePathname } from 'next/navigation';

const FacebookRepost = ({ title, quote }: { title: string, quote: string }) => {
    const url = usePathname();
    return (
        <>
            <FacebookShare url={url} quote={quote} title={title}/>
        </>
    );
};

export default FacebookRepost;