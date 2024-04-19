import React from 'react';
import Image from 'next/image';

import fallBackImage from '../../assets/images/fallback.webp';
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
                    // className={'slide_picture'}
                    sizes={'(max-width: 1920px) 30vw'}
                //   placeholder={'blur'}
                //  blurDataURL={String(getBase64FromUrl(img))}
            />}
        </div>
    );
};

export default MyImage;