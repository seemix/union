export const imageParser = (text: string) => {
    const urlRegex = /<img.*?src=["'](.*?)["']/g;
    const matches = text.match(urlRegex);
    if (!matches) return [];

    const urls = matches.map(match => {
        const hrefMatch = /src=['"]([^'"]+)['"]/i.exec(match);
        if (hrefMatch) {
            return hrefMatch[1];
        }
        return '';
    });
    return urls.filter(url => url).map(url => {
        return { src: url?.toString().replace(/-\d+x\d+(_[a-zA-Zа-яА-Я0-9]+)?\./, '.') };
    });
};