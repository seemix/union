export const markText = (text: string, queryString: string) => {
    const parts = text.split(new RegExp(`(${queryString})`, 'gi'));
    return parts.map((part) => {
        if (part.toLowerCase() === queryString.toLowerCase()) {
            return `<span class='marked_text'>${part}</span>`;
        } else {
            return part;
        }
    }).join('');
};
