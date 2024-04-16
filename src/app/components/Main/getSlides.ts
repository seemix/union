import { baseURL } from '@/app/assets/common';
import { IMappedCategoryPost } from '@/app/category/types';
import { mappedCategoryPosts } from '@/app/category/mapper';

export const getSlides = async (categoryId: number, count: number, excerptLength: number = 1): Promise<IMappedCategoryPost[]> => {
    const response = await fetch(baseURL + `posts&categories=${categoryId}&page=1&per_page=${count}`, {
        next: {
            revalidate: 60
        }
    });
    const data = await response.json();
    return mappedCategoryPosts(data, excerptLength);
};