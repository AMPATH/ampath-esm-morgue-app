import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DataTable,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Pagination,
  OverflowMenu,
  OverflowMenuItem,
  Tag,
  DataTableSkeleton,
  Search,
} from '@carbon/react';
import { launchWorkspace2, navigate, useConfig, useLayoutType, useVisit } from '@openmrs/esm-framework';
import styles from '../bed-linelist-view.scss';
import { convertDateToDays, formatDateTime } from '../../utils/utils';
import { Patient, Person, type MortuaryLocationResponse } from '../../types';
import { ConfigObject } from '../../config-schema';
import { mutate as mutateSWR } from 'swr';
import EmptyMorgueAdmission from '../../empty-state/empty-morgue-admission.component';
import { StorageAssignment } from '../../morgue-management/types';
import PostmortemReportExtensionSlot from '../../extension/postmortem-report-extension-slot.component';

interface AdmittedBedLineListViewProps {
  admitted: StorageAssignment[];
  isLoading: boolean;
  paginated?: boolean;
  initialPageSize?: number;
  pageSizes?: number[];
  onPostmortem?: (patientUuid: string) => void;
  onDischarge?: (patientUuid: string, storageAssignmentUuid?: string) => void;
  onSwapCompartment?: (patientUuid: string, bedId: string) => void;
  onDispose?: (patientUuid: string) => void;
  mutate?: () => void;
}

const AdmittedBedLineListView: React.FC<AdmittedBedLineListViewProps> = ({
  admitted,
  isLoading,
  paginated = true,
  initialPageSize = 10,
  pageSizes = [10, 20, 30, 40, 50],
  onPostmortem,
  onDischarge,
  onSwapCompartment,
  onDispose,
  mutate,
}) => {
  const { t } = useTranslation();
  const { autopsyFormUuid } = useConfig<ConfigObject>();
  const isTablet = useLayoutType() === 'tablet';
  const controlSize = isTablet ? 'md' : 'sm';

  const [currentPage, setCurrentPage] = useState(1);
  const [currPageSize, setCurrPageSize] = useState(initialPageSize);
  const [searchTerm, setSearchTerm] = useState('');

  const daysInMortuary = ({ startDate }: { startDate: string }) => {
    const days = convertDateToDays(startDate);

    return (
      <>
        {days} {days === 1 ? t('day', 'Day') : t('days', 'Days')}
      </>
    );
  };

  const headers = [
    { key: 'admissionDate', header: t('admissionDate', 'Admission Date') },
    { key: 'dateOfDeath', header: t('dateOfDeath', 'Date of death') },
    { key: 'idNumber', header: t('identifiers', 'Identifiers') },
    { key: 'patientName', header: t('patientName', 'Patient Name') },
    { key: 'gender', header: t('gender', 'Gender') },
    { key: 'age', header: t('age', 'Age') },
    { key: 'compartmentNumber', header: t('compartmentNumber', 'Compartment number') },
    { key: 'storageUnit', header: t('storageUnit', 'Storage unit') },
    { key: 'daysAdmitted', header: t('daysInMortuary', 'Days in Mortuary') },
    { key: 'status', header: t('status', 'Status') },
    { key: 'action', header: t('action', 'Action') },
  ];

  const handlePostmortem = (patientUuid: string, bedInfo?: { bedNumber: string; bedId: number }) => {
    if (onPostmortem) {
      onPostmortem(patientUuid);
    } else {
      launchWorkspace2('mortuary-form-entry', {
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
    // const base = `${window.getOpenmrsSpaBase()}home/morgue/patient/${patientUuid}`;
    // const to = hasBedInfo
    //   ? `${base}/compartment/${bedInfo.bedNumber}/${bedInfo.bedId}/mortuary-chart`
    //   : `${base}/mortuary-chart`;
    // navigate({ to });
  };
  const handleDischarge = (patientUuid: string, storageAssignmentUuid?: string) => {
    if (onDischarge) {
      onDischarge(patientUuid, storageAssignmentUuid);
    } else {
      launchWorkspace2('discharge-body-form', {
        patientUuid: patientUuid,
        storageAssignmentUuid,
        mutate,
      });
    }
  };

  const handleSwapCompartment = (patientUuid: string, bedId: string) => {
    if (onSwapCompartment) {
      onSwapCompartment(patientUuid, bedId.toString());
    } else {
      launchWorkspace2('swap-unit-form', {
        patientUuid: patientUuid,
        bedId,
        // mortuaryLocation: AdmittedDeceasedPatient,
        mutate,
      });
    }
  };

  const getIdNumber = (patient: any) => {
    const identifiers = patient?.identifiers?.filter(id => !id?.identifierType?.display?.toLowerCase()?.includes("universal"))
      ?.map(id => id?.identifier)
      ?.join(",");
    return identifiers ?? "-";
  };

  const getPatientName = (patient: any) => {
    if (!patient) {
      return '-';
    }

    if (patient && patient?.person) {
      return patient?.person?.display;
    }

    return '-';
  };

  const allRows = useMemo(() => {
    if (isLoading) {
      return [];
    }


    const rows = [];


    if (admitted.length) {
      for (const adm of admitted) {
        const compartment = adm?.compartment;
        const patient = adm?.patient;
        const patientUuid = patient?.uuid;
        const patientName = getPatientName(patient);
        const gender = patient?.person?.gender || '-';
        const age = patient?.person?.age?.toString() || '-';
        const causeOfDeath = patient?.person?.causeOfDeath?.display || t('unknown', 'Unknown');
        const dateOfDeath = patient?.person?.deathDate;
        const dateOfAdmission = adm?.dateAdmitted;
        const daysAdmitted = daysInMortuary({ startDate: dateOfAdmission }); //calculateDaysAdmitted(dateOfAdmission).toString();
        const idNumber = getIdNumber(patient);

        rows.push({
          id: `${compartment?.uuid}-${patientUuid}`,
          storageUnit: adm?.compartment?.storageUnit?.display,
          status: adm?.status,
          patientName,
          idNumber,
          gender,
          age,
          dateOfDeath: formatDateTime(dateOfDeath),
          admissionDate: formatDateTime(dateOfAdmission),
          causeOfDeath,
          daysAdmitted,
          isEmpty: false,
          patientUuid,
          compartmentUuid: compartment?.uuid,
          compartmentNumber: compartment?.display,
          storageAssignmentUuid: compartment?.uuid,
          personUuid: patient.person?.uuid || '',
          searchableText: `${patientName} ${idNumber} ${gender} ${compartment?.display} ${adm?.compartment?.storageUnit?.display}`.toLowerCase(),
        });
      }
    }

    return rows;
  }, [admitted, t, isLoading]);

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) {
      return allRows;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    return allRows.filter(
      (row) =>
        row.searchableText.includes(searchLower) ||
        row.patientName.toLowerCase().includes(searchLower) ||
        row.idNumber.toLowerCase().includes(searchLower) ||
        row.gender.toLowerCase().includes(searchLower) ||
        row.storageUnit?.toString().includes(searchLower)
    );
  }, [allRows, searchTerm]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const hasSearchTerm = searchTerm.trim().length > 0;
  const hasNoSearchResults = hasSearchTerm && filteredRows.length === 0;
  const totalCount = filteredRows.length;

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <DataTableSkeleton columnCount={headers.length} rowCount={5} zebra />
      </div>
    );
  }

  if (!admitted) {
    return (
      <div>
        <EmptyMorgueAdmission title={t('noAdmittedPatient', 'No deceased patients currently admitted')} />
      </div>
    );
  }

  const startIndex = (currentPage - 1) * currPageSize;
  const endIndex = startIndex + currPageSize;
  const paginatedRows = paginated ? filteredRows.slice(startIndex, endIndex) : filteredRows;

  const goTo = (page: number) => setCurrentPage(page);

  const handlePaginationChange = ({ page: newPage, pageSize }: { page: number; pageSize: number }) => {
    if (newPage !== currentPage) {
      goTo(newPage);
    }
    if (pageSize !== currPageSize) {
      setCurrPageSize(pageSize);
      setCurrentPage(1);
    }
  };

  const NoSearchResults = () => (
    <div className={styles.emptyState}>
      <EmptyMorgueAdmission title={t('noSearchResults', 'We couldn’t find anything')} />
    </div>
  );

  return (
    <div className={styles.bedLayoutWrapper}>
      <div className={styles.searchContainer}>
        <Search
          labelText={t('noSearchDeceasedPatients', 'Search deceased patients')}
          placeholder={t('searchPatientsPlaceholder', 'Search by name, ID number, gender, compartment, or bed type...')}
          value={searchTerm}
          onChange={handleSearchChange}
          size={controlSize}
        />
      </div>
      {hasNoSearchResults ? (
        <NoSearchResults />
      ) : (
        <>
          <DataTable rows={paginatedRows} headers={headers} isSortable useZebraStyles>
            {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
              <TableContainer>
                <Table {...getTableProps()} aria-label="mortuary beds table">
                  <TableHead>
                    <TableRow>
                      {headers.map((header) => (
                        <TableHeader key={header.key} {...getHeaderProps({ header })}>
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => {
                      const rowData = allRows.find((r) => r.id === row.id);
                      if (!rowData) {
                        return null;
                      }

                      return (
                        <TableRow key={row.id} {...getRowProps({ row })}>
                          {row.cells.map((cell) => {
                            const cellKey = cell.info.header as keyof typeof rowData;

                            // if (cell.info.header === 'daysAdmitted' && !rowData.isEmpty) {
                            //   return (
                            //     <TableCell key={cell.id}>
                            //       <DaysInMortuary patientUuid={rowData.patientUuid} />
                            //     </TableCell>
                            //   );
                            // }

                            // if (cell.info.header === 'admissionDate' && !rowData.isEmpty) {
                            //   return (
                            //     <TableCell key={cell.id}>
                            //       <AdmissionDate patientUuid={rowData.patientUuid} />
                            //     </TableCell>
                            //   );
                            // }

                            if (cell.info.header === 'status') {
                              return (
                                <TableCell key={cell.id}>
                                  <Tag type={rowData.status === 'AVAILABLE' ? 'green' : 'red'} size="sm">
                                    {rowData.status === 'AVAILABLE'
                                      ? t('available', 'Available')
                                      : t('occupied', 'Occupied')}
                                  </Tag>
                                </TableCell>
                              );
                            }

                            if (cell.info.header === 'action') {
                              return (
                                <TableCell key={cell.id}>
                                  {!rowData.isEmpty && (
                                    <OverflowMenu flipped>
                                      <OverflowMenuItem
                                        onClick={() => {
                                          const hasBedInfo = rowData?.compartmentUuid;
                                          const base = `${window.getOpenmrsSpaBase()}home/morgue/patient/${rowData.patientUuid
                                            }`;
                                          const to = hasBedInfo
                                            ? `${base}/compartment/${rowData.compartmentUuid}/${rowData.compartmentUuid}/mortuary-chart`
                                            : `${base}/mortuary-chart`;
                                          navigate({ to });
                                        }}
                                        itemText={t('viewDetails', 'View details')}
                                      />
                                      <OverflowMenuItem
                                        onClick={() => handlePostmortem(rowData.patientUuid)}
                                        itemText={t('postmortemForm', 'Postmortem')}
                                      />
                                      <PostmortemReportExtensionSlot patientUuid={rowData.patientUuid} />
                                      {!rowData.storageAssignmentUuid && (
                                        <OverflowMenuItem
                                          onClick={() => handleSwapCompartment(rowData.patientUuid, rowData?.compartmentUuid)}
                                          itemText={t('compartmentSwap', 'Compartment swap')}
                                        />
                                      )}
                                      <OverflowMenuItem
                                        onClick={() =>
                                          handleDischarge(rowData.patientUuid, rowData.storageAssignmentUuid)
                                        }
                                        itemText={t('discharge', 'Discharge')}
                                      />
                                    </OverflowMenu>
                                  )}
                                </TableCell>
                              );
                            }
                            return <TableCell key={cell.id}>{rowData[cellKey] || '-'}</TableCell>;
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataTable>

          {paginated && !isLoading && totalCount > 0 && (
            <Pagination
              page={currentPage}
              pageSize={currPageSize}
              pageSizes={pageSizes}
              totalItems={totalCount}
              size={'sm'}
              onChange={handlePaginationChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default AdmittedBedLineListView;
