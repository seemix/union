export const metaDescriptionTransformer = (description: string): string => {
    const match = description.match(/<p>(.*?)<\/p>/);
    if (match && match[1]) {
        return match[1].replace(/<\/?[^>]+(>|$)/g, ''); // Видаляємо всі HTML теги
    }
    return description;
};