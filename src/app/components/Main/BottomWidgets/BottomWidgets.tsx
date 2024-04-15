import React from 'react';
import { LuChurch } from 'react-icons/lu';
import { LiaBibleSolid } from 'react-icons/lia';
import { MdOutlineOnlinePrediction } from 'react-icons/md';

import css from './BottomWidgets.module.css';
import { biblePassage } from '@/app/components/Main/bible';
import Link from 'next/link';

const BottomWidgets = () => {
    const passage = biblePassage();
    return (
        <div className={css.widgets_wrapper}>
            <div className={css.widget_card}>
                <Link href={'/page?id=111876'} className={css.link}>
                    <LuChurch size={'3em'}/>
                    <h3>Контакты церквей</h3>
                </Link>
            </div>
            <div className={css.widget_card}>
                <Link href={'page?id=11'} className={css.link}>
                    <LiaBibleSolid size={'3em'}/>
                    <h3>Библия за год</h3>
                </Link>
                <p>{passage}</p>
            </div>
            <div className={css.widget_card}>
                <Link href={'/page?id=45477'} className={css.link}>
                    <MdOutlineOnlinePrediction size={'3em'}/>
                    <h3>Церковь он-лайн</h3>
                </Link>
            </div>
        </div>
    );
};

export default BottomWidgets;