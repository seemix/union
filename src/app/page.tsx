import styles from "./page.module.css";
import React from 'react';
import Menu from '@/app/components/Menu/Menu';

export default function Home() {
  return (
    <main className={styles.main}>
     <Menu/>
    </main>
  );
}
