import React, { useMemo } from 'react';
import { Layer, Tile } from '@carbon/react';
import styles from './metrics-card.scss';

type cardNames = "AWAITING" | "ADMITTED" | "DISCHARGED";
interface MetricsCardProps {
  label: string | React.ReactNode;
  value: number | string | React.ReactNode;
  headerLabel: string | React.ReactNode;
  children?: React.ReactNode;
  cardName: cardNames; 
}

const MetricsCard: React.FC<MetricsCardProps> = ({ children, headerLabel, label, value, cardName }) => {
  const tileBackgroundColor = useMemo(() => {
    const cardColor = cardName === "AWAITING" ? styles.awaitingTile 
      : cardName === "ADMITTED" ? styles.admittedTile
        : styles.dischargedTile;
    return cardColor;
  }, [cardName]);

  return (
    <Layer className={`${children && styles.cardWithChildren} ${styles.container}`}>
      <Tile className={`${styles.tileContainer} ${tileBackgroundColor}`}>
        <div className={styles.tileHeader}>
          <div className={styles.headerLabelContainer}>
            <label className={styles.headerLabel}>{headerLabel}</label>
          </div>
          {children}
        </div>
        <div>
          <label className={styles.totalsLabel}>{label}</label>
          <p className={styles.totalsValue}>{value}</p>
        </div>
      </Tile>
    </Layer>
  );
};

export default MetricsCard;
