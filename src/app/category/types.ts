export interface IRawPost {
    id: number;
    date: string;
    title: {
        rendered: string;
    };
    excerpt: {
        rendered: string;
        protected: boolean;
    };
    author: number;
    featured_media: number;
    fimg_url: string;
    views: number;
}
export interface IMappedCategoryPost {
    id: number;
    title: string;
    date: string;
    views: number;
    excerpt: string;
    image?: string;
}