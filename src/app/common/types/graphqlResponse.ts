interface IExtensions {
    debug: {
        type: string;
        message: string;
    }[];
}
export interface IGraphQlResponse<T> {
    data: T;
    extensions: IExtensions;
}