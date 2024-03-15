const replacePattern = {
    '&#8220;': '"',
    '&#8211;': '|',
    '&#8221;': '"',
    '&quot;': '',
    '&nbsp;': '',
    // '&#8211;': '|'
};
export const contentTransformer = (inputString: string): string => {

    // Create a regular expression pattern using the keys of replaceObj
    const pattern = new RegExp(Object.keys(replacePattern).join('|'), 'g');

    // Replace all occurrences of keys in the string with their corresponding values
    // @ts-ignore
    return inputString.replace(pattern, match => replacePattern[match]);

};