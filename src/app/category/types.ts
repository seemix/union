import { IGraphQlResponse } from '@/app/common/types/graphqlResponse';

interface PostNode {
    node: {
        databaseId: number;
        title: string;
        date: string;
        excerpt: string;
        featuredImage?: {
            node: {
                mediaItemUrl: string;
            }
        }
    };

}

interface ICategoryPost {
    category: {
        databaseId: number;
        posts: {
            edges: PostNode[]
        }
    };
}

export interface ICategoryPostResponse extends IGraphQlResponse<ICategoryPost> {
    data: ICategoryPost;
}

export interface IMappedCategoryPost {
    id: number;
    title: string;
    date: string;
    excerpt: string;
    image?: string;
}