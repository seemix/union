import React from 'react';

import { menuQuery } from '@/app/components/Menu/query';
import { IMenuResponse } from '@/app/components/Menu/types';
import { getData } from '@/app/common/getData';
import { mappedMenu } from '@/app/components/Menu/mapper';
import { MenuItem } from '@/app/components';
import { frontendUrl } from '@/app/assets/common';
import css from './Menu.module.css';

const Menu = async () => {
    const response: IMenuResponse = await getData(menuQuery);
    const menu = mappedMenu(response);
    menu[0].uri = frontendUrl;
    return (
        <nav className={css.menu}>
            <ul>
                {menu && menu.map(item => <MenuItem
                    key={item.id}
                    id={item.id}
                    label={item.label}
                    uri={item.uri}
                    subMenu={item.subMenu}/>)}
            </ul>
        </nav>
    );
};

export default Menu;