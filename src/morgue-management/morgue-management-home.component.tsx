import React from 'react';
import classNames from 'classnames';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLeftNav, useLayoutType, isDesktop } from '@openmrs/esm-framework';
import styles from './morgue-management.scss';
import MorgueManagementDashboard from './dashboard/dashboard.component';
import StorageUnits from './storage-units/storage-units.component';
import Compartments from './compartments/compartments.component';
import MorgueHeader from './morgue-header/morgue-header.component';

const MorgueManagementHome: React.FC = () => {
  const { t } = useTranslation();
  const layout = useLayoutType();
  const basePath = `${window.spaBase}/morgue-management`;

  useLeftNav({ name: 'morgue-management-left-panel-slot', basePath });

  return (
    <BrowserRouter basename={basePath}>
      <div className={styles.pageWrapper}>
        <main className={classNames(styles.pageContent, { [styles.hasLeftNav]: isDesktop(layout) })}>
          <MorgueHeader title={t('morgueAdministration', 'Morgue administration')} />
          <Routes>
            <Route path="/" element={<MorgueManagementDashboard />} />
            <Route path="/storage-units" element={<StorageUnits />} />
            <Route path="/compartments" element={<Compartments />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default MorgueManagementHome;