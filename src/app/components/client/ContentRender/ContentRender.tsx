'use client';
import React, { useState } from 'react';
import { Parser } from 'html-to-react';
import { SlideImage } from 'yet-another-react-lightbox';

import { LightBox } from '@/app/components';
import css from './ContentRender.module.css';

const ContentRender = ({ content, slides }: { content: string, slides: SlideImage[] }) => {
    const [open, setOpen] = useState<boolean>(false);
    const [slideIndex, setSlideIndex] = useState<number>(0);
    const findSlideIndex = (slides: SlideImage[], link: string) => {
        for (let i = 0; i < slides.length; i++) {
            if (slides[i].src.split(':')[1] === link?.split(':')[1]) {
                return i;
            }
        }
        return -1;
    };
    const handleClick = (e: any) => {
        if (e.target.src) {
            e.preventDefault();
            const link = decodeURIComponent(e.target.src)
                .replace(/-\d+x\d+(_[a-zA-Zа-яА-Я0-9]+)?\./, '.');
            setSlideIndex(findSlideIndex(slides, link));
            setOpen(true);
        }
    };
    return (
        <div onClick={handleClick} className={css.post_content}>
            <LightBox slides={slides} index={+slideIndex} open={open} setOpen={setOpen}/>
            {Parser().parse(content)}
        </div>
    );
};

export default ContentRender;