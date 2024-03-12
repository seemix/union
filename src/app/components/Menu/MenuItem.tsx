import React from 'react';
import { IMappedMenuItem } from '@/app/components/Menu/types';
import css from '@/app/components/Menu/Menu.module.css';
import Link from 'next/link';

const MenuItem = (item: IMappedMenuItem) => {
    return (
        <li key={item.id}>
            {item.children.length > 0 ? <><label htmlFor={item.id}>
                <span>{item.label} <i className={css.arrow_right}/> </span>
            </label>
                <input type={'checkbox'} id={item.id}/>
            </> : <Link href={item.uri}>{item.label}</Link>}
            {item.children.length > 0 && <>
                <ul> {item.children.map(child => <li key={child.id}>
                    <Link href={child.uri}>{child.label}</Link>
                </li>)}</ul>
            </>}
        </li>
    );
};

export default MenuItem;