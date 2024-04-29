import type { Metadata } from 'next';
import { ArrowUp, Footer, Header, Menu } from '@/app/components';
import TopBar from '@/app/components/client/TopBar/TopBar';
import AppWrapper from '@/app/context/context';
import './globals.css';

// const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Baptist Union of Moldova',
    description: 'Союз церквей евангельских христиан-баптистов Молдовы',
};

export default function RootLayout({ children }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body>
        <AppWrapper>
            <Header/>
            <TopBar><Menu/></TopBar>
            <main style={{ minHeight: '50vh' }}>{children}</main>
            <Footer/>
            <ArrowUp/>
        </AppWrapper>
        </body>
        </html>
    );
}