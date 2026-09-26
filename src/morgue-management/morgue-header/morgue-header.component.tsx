import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './morgue-header.scss';
import MorgueIllustration from './morgue-illustration.component';

interface BillingHeaderProps {
  title: string;
}

const MorgueHeader: React.FC<BillingHeaderProps> = ({ title }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.header} data-testid="morgue-header">
      <div className={styles['left-justified-items']}>
        <MorgueIllustration />
        <div className={styles['page-labels']}>
          <p>{t('morgue', 'Morgue')}</p>
          <p className={styles['page-name']}>{title}</p>
        </div>
      </div>
    </div>
  );
};

export default MorgueHeader;