'use client';
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Lightbox, { SlideImage } from 'yet-another-react-lightbox';
import { Thumbnails, Zoom, Slideshow } from 'yet-another-react-lightbox/plugins';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import 'yet-another-react-lightbox/styles.css';

const LightBox = ({ slides }: { slides: SlideImage[] }) => {
    const [open, setOpen] = useState<boolean>(false);
    const [index, setIndex] = useState<number>(0);
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const closeLightBox = () => {
        setOpen(false);
        const params = new URLSearchParams(searchParams.toString());
        params.delete('lightbox');
        router.push(`${pathname}?${params.toString()}`);
    };
    useEffect(() => {
        const lightbox = searchParams.get('lightbox');
        const startIndex = slides.findIndex(item => item.src.split('/').reverse()[0] === lightbox);
        setIndex(startIndex);
        if (lightbox) setOpen(true);
    }, []);

    return (
        <Lightbox open={open}
                  index={index}
                  close={closeLightBox}
                  slides={slides}
                  plugins={[Slideshow, Thumbnails, Zoom]}
        >
        </Lightbox>
    );
};

export default LightBox;