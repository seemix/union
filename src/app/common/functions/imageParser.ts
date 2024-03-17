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
    const urlRegex = /<a\s+(?:[^>]*?\s+)?href=([^\s>]+)/g;
    const matches = text.match(urlRegex);
    if (!matches) return [];

    const urls = matches.map(match => {
        const hrefMatch = /href=['"]([^'"]+)['"]/i.exec(match);
        if (hrefMatch) {
            return hrefMatch[1];
        }
        return null;
    });
    return urls.filter(url => url).map(url => {
        return { src: String(url) };
    });
};