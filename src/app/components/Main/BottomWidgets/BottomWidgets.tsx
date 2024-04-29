import React from 'react';
import { LiaBibleSolid } from 'react-icons/lia';
import { MdOutlineOnlinePrediction } from 'react-icons/md';
import Link from 'next/link';

import { biblePassage } from '@/app/components/Main/bible';
import css from './BottomWidgets.module.css';

const BottomWidgets = () => {
    const passage = biblePassage();
    return (
        <div className={css.widgets_wrapper}>
            {/*<div className={css.widget_card}>*/}
            {/*    <Link href={'/page?id=111876'} className={css.link}>*/}
            {/*        <LuChurch size={'3em'} color={'var(--gray-hex)'}/>*/}
            {/*        <h3>Контакты церквей</h3>*/}
            {/*    </Link>*/}
            {/*</div>*/}
            <div className={css.widget_card}>
                <Link href={''} className={css.link}>
                    <LiaBibleSolid size={'3em'} color={'var(--gray-hex)'}/>
                    <h3>Biblia peste un an</h3>
                </Link>
                <p>{passage}</p>
            </div>
            <div className={css.widget_card}>
                <Link href={'/page?id=15459'} className={css.link}>
                    <MdOutlineOnlinePrediction size={'3em'} color={'var(--red-hex)'}/>
                    <h3>Biserica online</h3>
                </Link>
            </div>
        </div>
    );
};

export default BottomWidgets;