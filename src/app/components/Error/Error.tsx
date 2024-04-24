import React from 'react';
import { VscError } from 'react-icons/vsc';

import css from './Error.module.css';

const Error = ({ message }: { message: string }) => {
    return (
        <div className={'main'}>
            <div className={css.error_wrapper}>
                <h2><VscError/> Ошибка загрузки</h2>
                <p>{message}</p>
            </div>
        </div>
    );
};

export default Error;