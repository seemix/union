export const metaDescriptionTransformer = (description: string): string => {
    return description.split('.')[0].replace(/<\/?[^>]+(>|$)/g, '');
};