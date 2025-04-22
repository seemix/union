'use client';

import { useEffect } from 'react';

import { customBaseURL } from '@/app/assets/common';

const PostViewCounter = ({ postId }: { postId: number }) => {
    useEffect(() => {
        const key = `viewed-post-${postId}`;
        const lastViewed = localStorage.getItem(key);
        const now = Date.now();

        if (!lastViewed || now - parseInt(lastViewed) > 10 * 60 * 1000) { // 10 minutes
            localStorage.setItem(key, now.toString());

            fetch(`${customBaseURL}/custom/v1/view-post/${postId}`, {
                method: 'POST',
            }).catch((error) => {
                console.error('Error incrementing post views:', error);
            });
        }
    }, [postId]);

    return null;
};

export default PostViewCounter;