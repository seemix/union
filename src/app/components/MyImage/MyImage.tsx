import React from 'react';
import Image from 'next/image';
import { getPlaiceholder } from 'plaiceholder';

import fallBackImage from '../../assets/images/fallback.webp';
import css from './MyImage.module.css';

const MyImage = async ({ img }: { img: string }) => {

    const checkRemoteImage = async (imagePath: string) => {
        try {
            const response = await fetch(imagePath, { method: 'HEAD' });
            if(response.ok) return imagePath;
        } catch (e) {
            return fallBackImage.src;
        }

    };
    const buffer = await fetch(img).then(async (res) => {
       return Buffer.from(await res.arrayBuffer());
    });
   const { base64 } = await getPlaiceholder(buffer);
    return (
        <div className={css.picture_wrapper}>
            {<Image src={await checkRemoteImage(img) as string} alt={img} fill
                    className={`${css.picture}`}
                    sizes={'(max-width: 1920px) 25vw'}
                   placeholder={'blur'}
                    blurDataURL={base64}
            />}
        </div>
    );
};

export default MyImage;