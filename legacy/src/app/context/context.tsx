'use client';

import React, { createContext, useContext } from 'react';

const AppContext = createContext<any>(undefined);

const AppWrapper = ({ children }: { children: React.ReactNode }) => {
    const [state, setState] = React.useState({
        openMenu: false
    });
    return (
        <AppContext.Provider value={{ state, setState }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);
export default AppWrapper;