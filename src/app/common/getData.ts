import { graphqlUrl } from '@/app/assets/common';
export const getData = async (query: string) => {
    const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: query
    });
    return response.json();
}