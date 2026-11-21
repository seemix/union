export interface IRawSearchResult {
    id: number;
    title: string;
    subtype: string;
    _embedded: {
        self: [{
            date: string;
            excerpt: {
                rendered: string;
            },
            fimg_url: string;
            views: number;
        }]
    }
}

export interface IMappedCategoryPost {
    id: number;
    title: string;
    subtype: string;
    date: string;
    views: number;
    excerpt: string;
    image?: string;
}