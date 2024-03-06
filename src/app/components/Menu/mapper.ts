import { IMenuResponse } from '@/app/components/Menu/types';

export const mappedMenu = (menu: IMenuResponse) => {
    return  menu.data.menu.menuItems.nodes.map(item => {
        return {
            id: item.id,
            label: item.label,
            uri: item.uri,
            children: item.childItems.nodes.map(child => {
                return {
                    id: child.id,
                    label: child.label,
                    uri: child.uri
                };
            })
        };
    });
};