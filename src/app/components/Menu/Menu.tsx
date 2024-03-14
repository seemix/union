import { menuQuery } from '@/app/components/Menu/query';
import { IMenuResponse } from '@/app/components/Menu/types';
import { getData } from '@/app/common/getData';
import { mappedMenu } from '@/app/components/Menu/mapper';
import { MenuItem } from '@/app/components';
import css from './Menu.module.css';

const Menu = async () => {
    const response: IMenuResponse = await getData(menuQuery);
    const menu = mappedMenu(response);
    return (
        <div>
            {/*<h3>Philip Yancey Amazing Grace</h3>*/}
            <nav className={css.menu}>
                <ul>
                    {menu && menu.map(item => <MenuItem
                        key={item.id}
                        id={item.id}
                        label={item.label}
                        uri={item.uri}
                        children={item.children}/>)}
                </ul>
            </nav>

        </div>
    );
};

export default Menu;