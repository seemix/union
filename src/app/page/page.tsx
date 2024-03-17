import React from 'react';

const Page = async ({ searchParams }: { searchParams: { id: string } }) => {
    return (
        <div className={'main'}>
            <h2>Page {searchParams.id}</h2>
        </div>
    );
};

export default Page;