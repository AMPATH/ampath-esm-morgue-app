import React from 'react';
import styles from './dashboard.scss';
import StorageUnits from '../storage-units/storage-units.component';

export default function MorgueManagementDashboard() {
  return (
    <main className={styles.container}>
      <main className={styles.servicesTableContainer}>
        <StorageUnits />
      </main>
    </main>
  );
}