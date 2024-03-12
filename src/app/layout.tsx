import type { Metadata } from 'next';
import './globals.css';
import { Menu } from '@/app/components';

// const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Baptist Union of Moldova',
    description: 'Generated by create next app',
};

export default function RootLayout({children}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body>
        <h1>Header</h1>
        <Menu/>
        {children}
        <h2>Footer</h2>
        </body>
        </html>
    );
}
