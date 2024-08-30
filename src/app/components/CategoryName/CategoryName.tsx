import React from 'react';

const CategoryName = ({ categoryName }: { categoryName: string }) => {
    return (
        <h2>
            {categoryName}
        </h2>
    );
};

export default CategoryName;