import React from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../header/header.component';
import styles from './home.scss';
import Summary from '../summary/summary.component';
import CustomContentSwitcher from '../switcher/content-switcher.component';
import {
  useMorgueEncounters,
} from './home.resource';

const HomeViewComponent: React.FC = () => {
  const { t } = useTranslation();
  const { awaitingAdmission, waitingToBeReceived, admitted, discharged, isLoading, mutate } = useMorgueEncounters();

  return (
    <section className={styles.section}>
      <Header title={t('mortuary', 'Mortuary')} />
      <Summary
        waitingToBeReceivedCount={waitingToBeReceived?.length || 0}
        awaitingQueueCount={awaitingAdmission?.length || 0}
        admittedCount={admitted?.length || 0}
        dischargedCount={discharged?.length || 0}
        isLoading={isLoading}
      />
      <CustomContentSwitcher
        awaitingAdmission={awaitingAdmission}
        waitingToBeReceived={waitingToBeReceived}
        admitted={admitted}
        discharged={discharged}
        isLoading={isLoading}
        mutate={mutate}
      />
    </section>
  );
};

export default HomeViewComponent;
