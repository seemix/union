import React from 'react';

const Page = ({ searchParams }: { searchParams: { id: string } }) => {
    return (
        <div>
            <h1>Page {searchParams.id}</h1>
        </div>
    );
};

export default Page;