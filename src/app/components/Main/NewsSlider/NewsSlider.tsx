import React from 'react';
import { baseURL } from '@/app/assets/common';
import { mappedCategoryPosts } from '@/app/category/mapper';
import { IMappedCategoryPost } from '@/app/category/types';
import NewsSwiper from '@/app/components/Main/NewsSlider/NewsSwiper';

const NewsSlider = async () => {
    const response = await fetch(baseURL + 'posts&categories=17&page=1&per_page=5');
    const data = await response.json();
    const news: IMappedCategoryPost[] =  mappedCategoryPosts(data, 50);
    return (
        <NewsSwiper slides={news}/>
    );
};

export default NewsSlider;