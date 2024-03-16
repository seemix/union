'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

const LightBox = ({ sl }: { sl: string[] }) => {
    const [open, setOpen] = useState<boolean>(false);
    const searchParams = useSearchParams();
    console.log(sl);
    useEffect(() => {
        const firstSlide = searchParams.get('firstSlide');
        if (firstSlide) setOpen(true);
    }, []);
    return (
        <Lightbox open={open}
                  close={() => setOpen(false)}
                  slides={[
                      { src: 'https://baptist.org.md/ru/wp-content/uploads/2024/02/a1.jpg' },
                      { src: 'https://baptist.org.md/ru/wp-content/uploads/2024/02/a2.jpg' }
                  ]}
        >
        </Lightbox>
    );
};

export default LightBox;