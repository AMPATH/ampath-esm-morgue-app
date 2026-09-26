import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layer, ClickableTile } from '@carbon/react';
import { ArrowRight } from '@carbon/react/icons';

const MorgueAdminCardLink: React.FC = () => {
  const { t } = useTranslation();
  const header = t('manageMorgue', 'Manage morgue');

  return (
    <Layer>
      <ClickableTile href={`${window.spaBase}/morgue-management`}>
        <div>
          <div className="heading">{header}</div>
          <div className="content">{t('morgueAdministration', 'Morgue administration')}</div>
        </div>
        <div className="iconWrapper">
          <ArrowRight size={16} />
        </div>
      </ClickableTile>
    </Layer>
  );
};

export default MorgueAdminCardLink;