import React from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../header/header.component';
import styles from './home.scss';
import Summary from '../summary/summary.component';
import CustomContentSwitcher from '../switcher/content-switcher.component';
import {
  useAwaitingPatients,
  useAwaitingQueuePatients,
  useStorageAssignmentAdmissionLocation,
} from './home.resource';
import { useLocation, useMortuaryAdmissionLocation } from '../bed-layout/bed-layout.resource';
import { DataTableSkeleton } from '@carbon/react';

const HomeViewComponent: React.FC = () => {
  const { t } = useTranslation();
  const [selectedLocation, setSelectedLocation] = React.useState<string>('');

  const { locations, isLoading: isLoadingLocation, error: locationError } = useLocation();

  const {
    admissionLocation: legacyAdmissionLocation,
    isLoading: isLoadingAdmission,
    error: admissionError,
    mutate: mutateAdmissionLocation,
  } = useMortuaryAdmissionLocation(selectedLocation);

  const {
    admissionLocation,
    isLoading: isLoadingAssignmentAdmission,
    error: assignmentAdmissionError,
    mutate: mutateAssignmentAdmission,
  } = useStorageAssignmentAdmissionLocation(legacyAdmissionLocation);

  const {
    awaitingQueueDeceasedPatients,
    admittedPatients,
    dischargedPatients,
    dischargedPatientsCount,
    isLoadingAwaitingQueuePatients,
    isLoadingDischarge,
    isLoadingAll,
    errorFetchingAwaitingQueuePatients,
    mutateAwaitingQueuePatients,
    mutateAll,
  } = useAwaitingQueuePatients(legacyAdmissionLocation);

  const locationItems = React.useMemo(() => {
    return locations.map((location) => ({
      id: location.ward.uuid,
      text: location.ward.display,
      ...location,
    }));
  }, [locations]);

  const isInitialDataLoading = React.useMemo(() => {
    return (
      isLoadingLocation ||
      isLoadingAdmission ||
      isLoadingAssignmentAdmission ||
      isLoadingAwaitingQueuePatients ||
      isLoadingDischarge ||
      (!selectedLocation && locationItems?.length === 0)
    );
  }, [
    isLoadingLocation,
    isLoadingAdmission,
    isLoadingAssignmentAdmission,
    isLoadingAwaitingQueuePatients,
    isLoadingDischarge,
    selectedLocation,
    locationItems,
  ]);

  const [hasInitialDataLoaded, setHasInitialDataLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!isInitialDataLoading && selectedLocation) {
      setHasInitialDataLoaded(true);
    }
  }, [isInitialDataLoading, selectedLocation]);

  const mutateAllData = React.useCallback(() => {
    mutateAdmissionLocation();
    mutateAssignmentAdmission();
    mutateAll();
  }, [mutateAdmissionLocation, mutateAssignmentAdmission, mutateAll]);

  React.useEffect(() => {
    if (locationItems?.length === 1 && !selectedLocation) {
      setSelectedLocation(locationItems[0].id);
    }
  }, [locationItems, selectedLocation]);

  const trulyAwaitingPatients = useAwaitingPatients(awaitingQueueDeceasedPatients);

  const handleLocationChange = React.useCallback((data: { selectedItem: { id: string; text: string } }) => {
    if (data.selectedItem) {
      setSelectedLocation(data.selectedItem.id);
      setHasInitialDataLoaded(false);
    }
  }, []);

  return (
    <section className={styles.section}>
      <Header title={t('mortuary', 'Mortuary')} />
      <Summary
        awaitingQueueCount={trulyAwaitingPatients.length}
        admittedCount={admittedPatients.length}
        dischargedCount={dischargedPatientsCount}
        isLoading={isInitialDataLoading && !hasInitialDataLoaded}
      />
      <CustomContentSwitcher
        awaitingQueueDeceasedPatients={trulyAwaitingPatients}
        isLoading={isInitialDataLoading && !hasInitialDataLoaded}
        locationItems={locationItems}
        selectedLocation={selectedLocation}
        admissionLocation={admissionLocation}
        isLoadingLocation={isLoadingLocation}
        isLoadingAdmission={isLoadingAdmission || isLoadingAssignmentAdmission}
        locationError={locationError}
        admissionError={admissionError || assignmentAdmissionError}
        onLocationChange={handleLocationChange}
        mutate={mutateAllData}
        dischargedPatients={dischargedPatients}
        isLoadingDischarge={isLoadingDischarge}
      />
    </section>
  );
};

export default HomeViewComponent;
