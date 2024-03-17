'use client';
import React from 'react';
import Lightbox, { SlideImage } from 'yet-another-react-lightbox';
import { Zoom, Slideshow } from 'yet-another-react-lightbox/plugins';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import 'yet-another-react-lightbox/styles.css';

const LightBox = ({ slides, index, open, setOpen }: {
    slides: SlideImage[],
    index: number,
    open: boolean,
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
}) => {

    return (
        <Lightbox open={open}
                  index={index}
                  close={() => setOpen(false)}
                  slides={slides}
                  plugins={[Slideshow, Zoom]}
        >
        </Lightbox>
    );
};

export default LightBox;