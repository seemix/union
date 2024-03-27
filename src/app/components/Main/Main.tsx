import React from 'react';

import css from './Main.module.css';
import { NewsSlider } from '@/app/components';
const Main = () => {
    return (
        <div className={css.main_container}>
            <div className={css.sliders}>
                <div><h1><NewsSlider/></h1></div>
                <div><h1>Slider2</h1></div>
            </div>
        </div>
    );
};

export default Main;