import React from 'react';

import styles from './page.module.css';
import TestComp from '@/app/components/TestComp';

export default function Home() {
    return (
        <main className={styles.main}>
            <TestComp/>
        </main>
    );
}
