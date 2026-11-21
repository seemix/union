import React from 'react';

import css from './Loader.module.css';

const Loader = () => {
    return (
        <div className={css.loader_container}>
            <div className={css.loader_spin}></div>
            <div className={css.loader}></div>
        </div>
    );
};

export default Loader;