import React from 'react';
import Image from 'next/image';

import fallBackImage from '../../assets/images/fallback.webp';
import css from './MyImage.module.css';

const MyImage = async ({ img }: { img: string }) => {
    // const myBlurDataUrl = await getBase64(img);
    const checkRemoteImage = async (imagePath: string) => {
        try {
            const response = await fetch(imagePath, { method: 'HEAD' });
            return response.ok;
        } catch (e) {
            return false;
        }

    };
    return (
        <div className={css.picture_wrapper}>
            {await checkRemoteImage(img) ? <Image src={img} alt={img} fill
                    //placeholder={'blur'}
                    // blurDataURL={await getBase64(img)}
                                                  style={{ objectFit: 'cover' }}

                /> :
                <Image src={fallBackImage} alt={img} fill placeholder={'blur'}/>}
        </div>
    );
};

export default MyImage;