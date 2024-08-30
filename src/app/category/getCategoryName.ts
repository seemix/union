import { baseURL } from '@/app/assets/common';
import { ICategoryInfo } from '@/app/components/CategoryName/types';
import { contentTransformer } from '@/app/common';

export const getCategoryName = async ({ id }: { id: string }): Promise<string> => {
    const response = await fetch(baseURL + 'categories/' + id);
    const categoryInfo: ICategoryInfo = await response.json();
    return contentTransformer(categoryInfo.name);
};
