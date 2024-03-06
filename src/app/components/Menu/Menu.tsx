import { menuQuery } from '@/app/components/Menu/query';
import { IMenuResponse } from '@/app/components/Menu/types';
import { getData } from '@/app/common/getData';
import { mappedMenu } from '@/app/components/Menu/mapper';
import css from './Menu.module.css';


const Menu = async () => {
    const response: IMenuResponse = await getData(menuQuery);
    const menu = mappedMenu(response);
    return (
        <div>
            <h3>Menu</h3>
            <div className={css.menu_wrapper}>
                <ul>
                    {menu && menu.map(item => <li key={item.id}> {item.label}
                        {item.children.length > 0 && <>
                            <ul> {item.children.map(child => <li key={child.id}>{child.label}</li>)}</ul>
                        </>}
                    </li>)}
                </ul>
            </div>

        </div>
    );
};


export default Menu;