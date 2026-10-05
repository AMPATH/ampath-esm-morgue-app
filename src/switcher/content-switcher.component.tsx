import React, { useCallback, useState } from 'react';
import {
  DataTableSkeleton,
  ContentSwitcher,
  Switch,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Search,
  ComboBox,
  SkeletonText,
  RadioButtonSkeleton,
  TextInputSkeleton,
} from '@carbon/react';
import { useTranslation } from 'react-i18next';
import styles from './content-switcher.scss';
import { CardHeader } from '@openmrs/esm-patient-common-lib';
import AwaitingBedLayout from '../bed-layout/awaiting/awaiting-bed-layout.component';
import BedLayout from '../bed-layout/admitted/admitted-bed-layout.component';
import { MortuaryLocationResponse, MortuaryPatient, Patient } from '../types';
import AwaitingBedLineListView from '../bed-linelist-view/awaiting/awaiting-bed-linelist-view.component';
import AdmittedBedLineListView from '../bed-linelist-view/admitted/admitted-bed-linelist-view.component';
import DischargedBedLayout from '../bed-layout/discharged/discharged-bed-layout.component';
import DischargedBedLineListView from '../bed-linelist-view/discharged/discharged-bed-line-view.component';
import { closeWorkspace, ExtensionSlot, FetchResponse, launchWorkspace2, openmrsFetch, restBaseUrl, showSnackbar, usePatient } from '@openmrs/esm-framework';
import { Add } from '@carbon/react/icons';
import usePatientSearchVisibility from '../hooks/usePatientSearchVisibility';
import WaitingToBeReceivedLineListView from '../bed-linelist-view/waiting/waiting-to-be-received-linelist-view.component';
import { StorageAssignment } from '../morgue-management/types';
import { type MortuaryDischargeEncounter } from '../bed-layout/discharged/discharged-bed-layout.resource';

enum ViewType {
  LIST = 0,
  CARD = 1,
}

enum TabType {
  WAITING_TO_BE_RECEIVED = 0,
  AWAITING_ADMISSION = 1,
  ADMITTED = 2,
  DISCHARGE = 3
}

interface TabConfig {
  id: string;
  labelKey: string;
  defaultLabel: string;
}

interface CustomContentSwitcherProps {
  awaitingAdmission: Array<MortuaryPatient>;
  waitingToBeReceived: Array<MortuaryPatient>;
  admitted: Array<StorageAssignment>;
  discharged: Array<MortuaryDischargeEncounter>;
  isLoading: boolean;
  mutate: () => void;
}

const CustomContentSwitcher: React.FC<CustomContentSwitcherProps> = ({
  waitingToBeReceived,
  awaitingAdmission,
  isLoading,
  admitted,
  discharged,
  mutate
}) => {
  const { t } = useTranslation();
  const [selectedView, setSelectedView] = React.useState<ViewType>(ViewType.LIST);
  const [selectedTab, setSelectedTab] = React.useState<TabType>(TabType.AWAITING_ADMISSION);

  const [patientSearchQuery, setPatientSearchQuery] = useState('');

  const { isPatientSearchOpen, showPatientSearch } = usePatientSearchVisibility();

  const patientSearchWorkspace = 'patient-search-button-slot';

  const hidePatientSearch = () => {
    closeWorkspace("patient-search-workspace");
  }

  const handleReturnToSearchList = useCallback(() => {
    showPatientSearch();
    closeWorkspace(patientSearchWorkspace);
  }, [showPatientSearch]);

  const tabs: TabConfig[] = [
    { id: 'waiting-to-be-received', labelKey: 'waitingToBeReceived', defaultLabel: 'Waiting to be received' },
    { id: 'awaiting-admission', labelKey: 'awaitingAdmission', defaultLabel: 'Awaiting Admission' },
    { id: 'admitted', labelKey: 'admitted', defaultLabel: 'Admitted' },
    { id: 'discharge', labelKey: 'discharged', defaultLabel: 'Discharged' },
  ];

  const handleViewChange = React.useCallback(({ index }: { index: number }) => {
    setSelectedView(index as ViewType);
  }, []);

  const handleTabChange = React.useCallback((state: { selectedIndex: number }) => {
    setSelectedTab(state.selectedIndex as TabType);
  }, []);

  const openAdmitWorkspace = (patientData: MortuaryPatient) => {
    patientData.patient = patientData.person as Patient;

    launchWorkspace2("admit-deceased-person-form", {
      patientData: patientData,
      selectedPatientUuid: patientData.patient.uuid,
      // mortuaryLocation: admissionLocation,
      mutated: mutate
    });
  }

  async function fetchPatient(uuid: string) {
    try {
      const url = `${restBaseUrl}/patient/${uuid}`;

      return await openmrsFetch<MortuaryPatient>(url);
    } catch (error) {
      showSnackbar({
        kind: 'error',
        title: t('error', 'Error'),
        subtitle: error instanceof Error ? error.message : t('unknownError', 'An unknown error occurred'),
      });
      return undefined;
    }
  }

  const renderTabContent = React.useCallback(
    (tabIndex: TabType) => {
      const isListView = selectedView === ViewType.LIST;

      if (isLoading) {
        return (
          <div className={styles.loadingContainer}>
            <DataTableSkeleton showHeader={false} showToolbar={false} />
          </div>
        );
      }

      switch (tabIndex) {
        case TabType.WAITING_TO_BE_RECEIVED:
          return isListView ? (
            <div className={styles.listContainer}>
              <WaitingToBeReceivedLineListView
                waitingToBeReceived={waitingToBeReceived}
                isLoading={isLoading}
                mutated={mutate}
              />
            </div>
          ) : (<></>)

        case TabType.AWAITING_ADMISSION:
          return isListView ? (
            <div className={styles.listContainer}>
              <AwaitingBedLineListView
                awaitingAdmission={awaitingAdmission}
                isLoading={isLoading}
                mutated={mutate}
              />
            </div>
          ) : (
            <>
              <AwaitingBedLayout
                awaitingAdmission={awaitingAdmission}
                isLoading={isLoading}
                mutated={mutate}
              />
            </>
          );

        case TabType.ADMITTED:
          return isListView ? (
            <div className={styles.listContainer}>
              <AdmittedBedLineListView
                admitted={admitted}
                isLoading={isLoading}
                mutate={mutate}
              />
            </div>
          ) : (
            <>
              <BedLayout admitted={admitted} isLoading={isLoading} mutate={mutate} />
            </>
          );

        case TabType.DISCHARGE:
          return isListView ? (
            <div className={styles.listContainer}>
              <DischargedBedLineListView
                discharged={discharged}
                isLoading={isLoading}
                mutate={mutate}
              />
            </div>
          ) : (
            <>
              <DischargedBedLayout
                discharged={discharged}
                isLoading={isLoading}
                mutate={mutate}
              />
            </>
          );

        default:
          return null;
      }
    },
    [
      selectedView,
      isLoading,
      waitingToBeReceived,
      awaitingAdmission,
      admitted,
      discharged,
      mutate,
    ],
  );

  return (
    <div className={styles.switcherContainer}>
      <CardHeader title={isLoading ? t('loading', 'Loading...') : t('mortuaryOperations', 'Mortuary operations')}>
        <ContentSwitcher size="sm" className={styles.switcher} selectedIndex={selectedView} onChange={handleViewChange}>
          <Switch>{isLoading ? <RadioButtonSkeleton /> : t('listView', 'List')}</Switch>
          <Switch>{isLoading ? <RadioButtonSkeleton /> : t('cardView', 'Card')}</Switch>
        </ContentSwitcher>
      </CardHeader>


      <ExtensionSlot
        name={patientSearchWorkspace}
        className={styles.admissionBtn}
        state={{
          buttonText: t('directAdmission', 'Direct admission'),
          buttonProps: {
            kind: 'secondary',
            renderIcon: (props) => <Add size={16} {...props} />,
            size: 'sm',
          },
          handleReturnToSearchList,
          hidePatientSearch,
          isOpen: isPatientSearchOpen,
          searchQuery: patientSearchQuery,
          searchQueryUpdatedAction: (searchQuery) => setPatientSearchQuery(searchQuery),
          selectPatientAction: async (selectedPatientUuid) => {
            const data = await fetchPatient(selectedPatientUuid);
            const patientData = data?.data;
            if (!patientData) {
              return;
            }

            if (patientData.person.dead) {
              openAdmitWorkspace(patientData);
            } else {
              launchWorkspace2("mark-person-deceased-form", {
                patientData: patientData,
                patientUuid: selectedPatientUuid,
                mutated: mutate,
                onMarkComplete: () => { openAdmitWorkspace(patientData) }
              });
            }

            hidePatientSearch();
          },
          showPatientSearch,
          workspaceTitle: t('admitPatientToMorgue', 'Admit patient to morgue'),
        }}
      />

      <div className={styles.tabsContainer}>
        <Tabs selectedIndex={selectedTab} onChange={handleTabChange}>
          {isLoading ? (
            <div className={styles.tabSkeletonContainer}>
              <div className={styles.tabListSkeleton}>
                {[1, 2, 3].map((i) => (
                  <RadioButtonSkeleton key={i} className={styles.tabSkeleton} />
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.tabListContainer}>
              <TabList scrollDebounceWait={200}>
                {tabs.map((tab) => (
                  <Tab key={tab.id}>
                    {t(tab.labelKey, tab.defaultLabel)}
                    {tab.id === 'waiting-to-be-received' && ` (${waitingToBeReceived?.length || 0})`}
                    {tab.id === 'awaiting-admission' && ` (${awaitingAdmission?.length || 0})`}
                    {tab.id === 'admitted' &&
                      ` (${admitted?.length || 0})`}
                    {tab.id === 'discharge' && ` (${discharged?.length || 0})`}
                  </Tab>
                ))}
              </TabList>
            </div>
          )}

          <TabPanels>
            {tabs.map((_, index) => (
              <TabPanel key={index}>{renderTabContent(index as TabType)}</TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </div>
    </div>
  );
};

export default CustomContentSwitcher;
