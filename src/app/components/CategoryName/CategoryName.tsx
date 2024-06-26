import React from 'react';

import { baseURL } from '@/app/assets/common';
import { contentTransformer } from '@/app/common/functions/contentTransformer';
import { ICategoryInfo } from './types';

const CategoryName = async ({ id }: { id: string }) => {
    const response = await fetch(baseURL + 'categories/' + id);
    const categoryInfo: ICategoryInfo = await response.json();
    const categoryName = contentTransformer(categoryInfo.name);
    return (
        <h2>
            {categoryName}
        </h2>
    );
};

export default CategoryName;