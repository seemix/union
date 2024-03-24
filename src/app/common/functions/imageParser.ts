import { SlideImage } from 'yet-another-react-lightbox';

export const imageParser1 = (inputString: string): SlideImage[] => {
    const pattern = /<img.*?src=["'](.*?)["']/g;
    const matches = inputString.match(pattern) || [];
    // @ts-ignore
    return matches.map(match => {
        // @ts-ignore
        return { src: match.match(/src=["'](.*?)["']/)[1] };
    });
};


export const imageParser = (text: string) => {
    const urlRegex = /<img.*?src=["'](.*?)["']/g;
    // const urlRegex = /<a\s+(?:[^>]*?\s+)?href=([^\s>]+)/g;
    const matches = text.match(urlRegex);
    if (!matches) return [];

    const urls = matches.map(match => {
        const hrefMatch = /src=['"]([^'"]+)['"]/i.exec(match);
        if (hrefMatch) {
            return hrefMatch[1];
        }
        return null;
    });
    return urls.filter(url => url).map(url => {
        return { src: url?.toString().replace(/-\d+x\d+(_[a-zA-Zа-яА-Я0-9]+)?\./, '.') };
    });
};