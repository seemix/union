import React from 'react';
import Image from 'next/image';

import fallBackImage from '@/app/assets/images/fallback.webp';
import { blurDataUrl } from '@/app/assets/common';
import css from './MyImage.module.css';

const MyImage = async ({ img }: { img: string }) => {
    const checkRemoteImage = async (imagePath: string) => {
        try {
            const response = await fetch(imagePath, { method: 'HEAD' });
            if (response.ok) return imagePath;
        } catch (e) {
            return fallBackImage.src;
        }
    };
    return (
        <div className={css.picture_wrapper}>
            {<Image src={await checkRemoteImage(img) as string} alt={img} fill
                    className={css.picture}
                    sizes={'(max-width: 1920px) 35vw'}
                    placeholder={'blur'}
                    blurDataURL={blurDataUrl}
            />}
        </div>
    );
};

export default MyImage;