// @ts-check

/**
 * @type {import('next').NextConfig}
 */
const config = {
    // output: 'export',
    // distDir: 'dist',
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'baptist.org.md',
                pathname: '**',
            },
        ],
    },
};

export default config;