import React from 'react';
import { VscError } from 'react-icons/vsc';

import css from './Error.module.css';

const Error = () => {
    return (
        <div className={'main'}>
            <div className={css.error_wrapper}>
                <h2><VscError/> Ошибка</h2>
                {/*<p>{message}</p>*/}
                <h1>404 | Страница не найдена</h1>
            </div>
        </div>
    );
};

export default Error;