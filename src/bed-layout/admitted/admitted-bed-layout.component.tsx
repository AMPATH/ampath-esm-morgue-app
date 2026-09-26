import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { InlineLoading, Search } from '@carbon/react';
import { launchWorkspace, navigate, useConfig, useLayoutType } from '@openmrs/esm-framework';
import styles from '../bed-layout.scss';
import BedCard from '../../bed/bed.component';
import { type MortuaryLocationResponse, type Patient } from '../../types';
import EmptyBedCard from '../../bed/empty-bed.component';
import Divider from '../../bed/divider/divider.component';
import { ConfigObject } from '../../config-schema';
import { mutate as mutateSWR } from 'swr';
import EmptyMorgueAdmission from '../../empty-state/empty-morgue-admission.component';
import { PatientProvider } from '../../context/deceased-person-context';
import { transformAdmittedPatient } from '../../helpers/expression-helper';
import { StorageAssignment } from '../../morgue-management/types';

interface BedLayoutProps {
  admitted: StorageAssignment[], 
  isLoading: boolean;
  onAdmit?: (patientUuid: string) => void;
  onPostmortem?: (patientUuid: string) => void;
  onDischarge?: (patientUuid: string) => void;
  onSwapCompartment?: (patientUuid: string, bedId: string) => void;
  mutate?: () => void;
}

const BedLayout: React.FC<BedLayoutProps> = ({
  admitted,
  isLoading,
  onPostmortem,
  onDischarge,
  onSwapCompartment,
  mutate,
}) => {
  const { t } = useTranslation();
  const { autopsyFormUuid } = useConfig<ConfigObject>();
  const [searchTerm, setSearchTerm] = useState('');
  const isTablet = useLayoutType() === 'tablet';
  const controlSize = isTablet ? 'md' : 'sm';

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handlePostmortem = (patientUuid: string, bedInfo?: { bedNumber: string; bedId: string | number }) => {
    const hasBedInfo = bedInfo?.bedNumber && bedInfo?.bedId;

    if (onPostmortem) {
      onPostmortem(patientUuid);
    } else {
      launchWorkspace('mortuary-form-entry', {
        formUuid: autopsyFormUuid,
        workspaceTitle: t('postmortemForm', 'Postmortem form'),
        patientUuid: patientUuid,
        encounterUuid: '',
        mutateForm: () => {
          mutateSWR((key) => true, undefined, {
            revalidate: true,
          });
        },
      });
    }
    const base = `${window.getOpenmrsSpaBase()}home/morgue/patient/${patientUuid}`;
    const to = hasBedInfo
      ? `${base}/compartment/${bedInfo.bedNumber}/${bedInfo.bedId}/mortuary-chart`
      : `${base}/mortuary-chart`;
    navigate({ to });
  };

  const handleDischarge = (patientUuid: string, compartmentUuid?: string | number, storageAssignmentUuid?: string) => {
    if (onDischarge) {
      onDischarge(patientUuid);
    } else {
      launchWorkspace('discharge-body-form', {
        workspaceTitle: t('dischargeForm', 'Discharge form'),
        patientUuid: patientUuid,
        compartmentUuid,
        storageAssignmentUuid,
        mutate,
      });
    }
  };

  const handleSwapCompartment = (patientUuid: string, compartmentUuid?: string | number) => {
    if (onSwapCompartment) {
      onSwapCompartment(patientUuid, compartmentUuid?.toString() || '');
    } else {
      launchWorkspace('swap-unit-form', {
        workspaceTitle: t('swapCompartment', 'Swap compartment'),
        patientUuid: patientUuid,
        compartmentUuid,
        // mortuaryLocation: AdmittedDeceasedPatient,
        mutate,
      });
    }
  };

  const handleViewDetails = (patientUuid: string, bedInfo?: { bedNumber: string; bedId: string | number }) => {
    const hasBedInfo = bedInfo?.bedNumber && bedInfo?.bedId;
    const base = `${window.getOpenmrsSpaBase()}home/morgue/patient/${patientUuid}`;
    const to = hasBedInfo
      ? `${base}/compartment/${bedInfo.bedNumber}/${bedInfo.bedId}/mortuary-chart`
      : `${base}/mortuary-chart`;
    navigate({ to });
  };

  const filteredBedLayouts = useMemo(() => {
    if (!admitted || !searchTerm.trim()) {
      return [];
    }

    const lowerSearchTerm = searchTerm.toLowerCase().trim();

    return admitted.filter((adm) => {
      const compartment = adm?.compartment?.display?.toString().toLowerCase() || '';
      const storageUnit = adm?.compartment?.storageUnit?.display?.toLowerCase() || '';

      if (compartment.includes(lowerSearchTerm) || storageUnit.includes(lowerSearchTerm)) {
        return true;
      }

      const adms = admitted || [];
      return adms.some((admx) => {
        const patientName = admx?.patient.person?.display?.toLowerCase() || '';
        const gender = admx?.patient.person?.gender?.toLowerCase() || '';
        const patientId = admx?.patient.uuid?.toLowerCase() || '';
        const causeOfDeath = admx?.patient.person?.causeOfDeath?.display?.toLowerCase() || '';

        return (
          patientName.includes(lowerSearchTerm) ||
          gender.includes(lowerSearchTerm) ||
          patientId.includes(lowerSearchTerm) ||
          causeOfDeath.includes(lowerSearchTerm)
        );
      });
    });
  }, [admitted, searchTerm]);

  const patientContextValue = {
    isLoading,
    mutate,
    onPostmortem: handlePostmortem,
    onDischarge: handleDischarge,
    onSwapCompartment: handleSwapCompartment,
    onViewDetails: handleViewDetails,
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <InlineLoading description={t('loadingPatients', 'Loading patients...')} />
      </div>
    );
  }

  const bedLayouts = filteredBedLayouts;
  if (!bedLayouts || bedLayouts.length === 0) {
    if (searchTerm.trim()) {
      return (
        <>
          <div className={styles.searchContainer}>
            <Search
              labelText={t('searchDeceasedPatients', 'Search deceased patients')}
              placeholder={t(
                'searchPatientsPlaceholder',
                'Search by name, ID number, gender, compartment, or bed type...',
              )}
              value={searchTerm}
              onChange={handleSearchChange}
              size={controlSize}
            />
          </div>
          <EmptyMorgueAdmission title={t('noMatchingPatients', 'No matching patients found')} />
        </>
      );
    }

    return <EmptyMorgueAdmission title={t('noAdmittedPatient', 'No deceased patients currently admitted')} />;
  }

  return (
    <PatientProvider value={patientContextValue}>
      <div className={styles.searchContainer}>
        <Search
          labelText={t('searchDeceasedPatients', 'Search deceased patients')}
          placeholder={t('searchPatientsPlaceholder', 'Search by name, ID number, gender, compartment, or bed type...')}
          value={searchTerm}
          onChange={handleSearchChange}
          size="sm"
        />
      </div>
      <div className={styles.bedLayoutWrapper}>
        <div className={styles.bedLayoutContainer}>
          {bedLayouts.map((bedLayout, index) => {
            const patient = bedLayout;
            const isEmpty = bedLayout.status === 'VACANT';

            if (isEmpty) {
              return (
                <EmptyBedCard
                  key={bedLayout?.compartment?.uuid || `empty-bed-${index}`}
                  bedNumber={bedLayout?.compartment?.display}
                  bedType={bedLayout?.compartment?.storageUnit?.display}
                  isEmpty={isEmpty}
                />
              );
            }

            return (
              <div
                key={bedLayout?.uuid}
                className={`${styles.bedContainer} ${patient ? styles.sharedBedContainer : ''}`}>
                {patient ? (
                  <div className={styles.horizontalLayout}>
                    <React.Fragment key={patient.uuid}>
                        <BedCard
                          patient={transformAdmittedPatient(patient?.patient as unknown as Patient, {
                            bedNumber: bedLayout?.compartment?.display,
                            bedId: bedLayout?.compartment?.uuid ?? '',
                            bedType: bedLayout?.compartment?.storageUnit?.display,
                            storageAssignmentUuid: bedLayout?.uuid,
                          })}
                          showActions={{
                            discharge: true,
                            swapCompartment: !bedLayout?.uuid,
                            postmortem: true,
                            viewDetails: true,
                          }}
                        />
                        {/* {patientIndex < patients.length - 1 && <Divider />} */}
                      </React.Fragment>
                  </div>
                ) : (
                  <></>
                  // <BedCard
                  //   patient={transformAdmittedPatient(patient, {
                  //     bedNumber: bedLayout?.compartment?.uuid,
                  //     bedId: bedLayout.bedId,
                  //     bedType: bedLayout.bedType?.displayName,
                  //     storageAssignmentUuid: bedLayout.storageAssignmentUuid,
                  //   })}
                  //   showActions={{
                  //     discharge: true,
                  //     swapCompartment: !bedLayout.storageAssignmentUuid,
                  //     postmortem: true,
                  //     viewDetails: true,
                  //   }}
                  // />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PatientProvider>
  );
};

export default BedLayout;
