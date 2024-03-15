export const dateTransformer = (date: string): string => {
    return date.split('T')[0].split('-').reverse().join('.');
};