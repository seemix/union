import React from 'react';

import css from './loading.module.css';

const Loading = () => {
    return (
        <div className={css.loader_container}>
            <div className={css.loader_spin}></div>
            <div className={css.loader}></div>
        </div>
    );
};

export default Loading;