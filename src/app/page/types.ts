export interface IRawPage {
    id: number;
    title: {
        rendered: string;
    };
    content: {
        rendered: string;
    }
}

export interface IMappedPage {
    id: number;
    title: string;
    content: string;
}