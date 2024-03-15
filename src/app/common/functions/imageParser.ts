export const imageParser = (inputString: string) : string[] => {
    const pattern = /<img.*?src=["'](.*?)["']/g;
    const matches = inputString.match(pattern) || [];
    // @ts-ignore
    return matches.map(match => match.match(/src=["'](.*?)["']/)[1]);
};
