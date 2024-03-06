import { IGraphQlResponse } from '@/app/common/types/graphqlResponse';

interface IChildItem {
    id: string;
    label: string;
    uri: string;
}
interface IMenuItem {
    id: string;
    label: string;
    uri: string;
    childItems: {
        nodes: IChildItem[];
    };
}

interface IMenuData {
    menu: {
        id: string;
        menuItems: {
            nodes: IMenuItem[];
        };
    };
}


export interface IMenuResponse extends IGraphQlResponse<IMenuData>{
    data: IMenuData;
}
