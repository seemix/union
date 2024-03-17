'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Lightbox, { SlideImage } from 'yet-another-react-lightbox';
import { Thumbnails, Zoom, Slideshow } from 'yet-another-react-lightbox/plugins';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import 'yet-another-react-lightbox/styles.css';

const LightBox = ({ slides }: { slides: SlideImage[] }) => {
    const [open, setOpen] = useState<boolean>(false);
    const searchParams = useSearchParams();

    useEffect(() => {
        const lightbox = searchParams.get('lightbox');
        if (lightbox) setOpen(true);
    }, []);

    return (
        <Lightbox open={open}
                  close={() => setOpen(false)}
                  slides={slides}
                  plugins={[Slideshow, Thumbnails, Zoom]}
        >
        </Lightbox>
    );
};

export default LightBox;