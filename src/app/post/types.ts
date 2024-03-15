export interface IRawPost {
    id: number;
    date: string;
    title: {
        rendered: string;
    };
    content: {
        rendered: string;
    };
    excerpt: {
        rendered: string;
    },
    views: number;
    fimg_url?: string;
    _embedded: {
        'wp:term': [
            [{
                id: number;
                link: string;
                name:string;
            }]
        ]
    }
}

export interface IMappedPost {
    id: number;
    date: string;
    views: number;
    title: string;
    content: string;
    fimg_url?: string;
    categories: {
        id: number;
        link: string;
        name: string;
    }[]
}