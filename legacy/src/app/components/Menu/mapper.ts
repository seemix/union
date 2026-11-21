import { IMappedMenuItem, IMenuResponse } from '@/app/components/Menu/types';

export const mappedMenu = (menu: IMenuResponse): IMappedMenuItem[] => {
    return menu.data.menu.menuItems.nodes.map(item => {
        return {
            id: item.id,
            label: item.label,
            uri: item.uri,
            subMenu: item.childItems.nodes.map(child => {
                let part1 = child.uri.slice(2).split('=')[0];
                if (part1 === 'page_id') {
                    part1 = 'page/';
                } else if (part1 === 'cat') {
                    part1 = 'category/';
                }
                const part2 = child.uri.split('=')[1];
                return {
                    id: child.id,
                    label: child.label,
                    uri: part1,
                    query: part2
                };
            })
        };
    });
};