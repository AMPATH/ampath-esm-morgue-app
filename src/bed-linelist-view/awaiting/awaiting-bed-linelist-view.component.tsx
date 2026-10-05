import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DataTable,
  InlineLoading,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Pagination,
  OverflowMenu,
  OverflowMenuItem,
  DataTableSkeleton,
  Search,
  Tile,
} from '@carbon/react';
import styles from '../bed-linelist-view.scss';
import { convertDateToDays, formatDateTime } from '../../utils/utils';
import { type MortuaryLocationResponse, type MortuaryPatient } from '../../types';
import { launchWorkspace2, useLayoutType } from '@openmrs/esm-framework';
import { useAwaitingPatients } from '../../home/home.resource';
import EmptyMorgueAdmission from '../../empty-state/empty-morgue-admission.component';

interface AwaitingBedLineListViewProps {
  awaitingAdmission: Array<MortuaryPatient>;
  isLoading: boolean;
  paginated?: boolean;
  initialPageSize?: number;
  pageSizes?: number[];
  onDischarge?: (patientUuid: string) => void;
  onDispose?: (patientUuid: string) => void;
  mutated?: () => void;
}

const AwaitingBedLineListView: React.FC<AwaitingBedLineListViewProps> = ({
  awaitingAdmission,
  isLoading,
  paginated = true,
  initialPageSize = 10,
  pageSizes = [10, 20, 30, 40, 50],
  onDischarge,
  onDispose,
  mutated,
}) => {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const controlSize = isTablet ? 'md' : 'sm';

  const [currentPage, setCurrentPage] = useState(1);
  const [currPageSize, setCurrPageSize] = useState(initialPageSize);
  const [searchTerm, setSearchTerm] = useState('');

  const headers = [
    { key: 'deathReportingDate', header: t('deathReportingDate', 'Death reporting date') },
    { key: 'dateOfDeath', header: t('dateOfDeath', 'Date of death') },
    { key: 'idNumber', header: t('identifiers', 'Identifiers') },
    { key: 'name', header: t('name', 'Name') },
    { key: 'gender', header: t('gender', 'Gender') },
    { key: 'age', header: t('age', 'Age') },
    { key: 'durationInQueue', header: t('durationInQueue', 'Days In Queue') },
    { key: 'action', header: t('action', 'Action') },
  ];

  const calculateDaysInQueue = (reportingDate: string): string => {
    if (!reportingDate) {
      return '0';
    }
    const days = convertDateToDays(reportingDate);
    return `${days} ${(days === 1 ? t('day', 'Day') : t('days', 'Days'))}`
  };

  const getIdentifiers = (patient: any) => {
    const identifiers = patient?.identifiers?.filter(id => !id?.display?.toLowerCase()?.includes("universal"))
      ?.map(id => {
        const spl = id?.display?.split("=");
        return spl?.length > 1 ? spl["1"] : "";
      })
      ?.join(",");
    return identifiers ?? "-";
  };

  const allRows = useMemo(() => {
    if (!awaitingAdmission || awaitingAdmission.length === 0) {
      return [];
    }

    const rows = awaitingAdmission.map((mortuaryPatient, index) => {
      const patientUuid = mortuaryPatient?.person?.uuid || `patient-${index}`;
      const patientName = mortuaryPatient?.person?.display || '-';
      const gender = mortuaryPatient?.person?.gender || '-';
      const age = mortuaryPatient?.person?.age || '-';
      const deathReportingDate = mortuaryPatient?.encounterDatetime;
      const daysInQueue = calculateDaysInQueue(deathReportingDate);
      const identifiers = getIdentifiers(mortuaryPatient?.patient);
      const dateOfDeath = mortuaryPatient?.person?.deathDate;

      return {
        id: patientUuid,
        deathReportingDate: formatDateTime(deathReportingDate),
        idNumber: identifiers,
        dateOfDeath,
        name: patientName,
        gender: gender,
        age: age.toString(),
        durationInQueue: daysInQueue.toString(),
        action: patientUuid,
        searchableText: `${patientName} ${identifiers} ${gender}`.toLowerCase(),
      };
    });

    return rows;
  }, [awaitingAdmission]);

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) {
      return allRows;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    return allRows.filter(
      (row) =>
        row.searchableText.includes(searchLower) ||
        row.name.toLowerCase().includes(searchLower) ||
        row.idNumber.toLowerCase().includes(searchLower) ||
        row.gender.toLowerCase().includes(searchLower),
    );
  }, [allRows, searchTerm]);

  const hasSearchTerm = searchTerm.trim().length > 0;
  const hasNoSearchResults = hasSearchTerm && filteredRows.length === 0;

  const totalCount = filteredRows.length;
  const startIndex = (currentPage - 1) * currPageSize;
  const endIndex = startIndex + currPageSize;
  const paginatedRows = paginated ? filteredRows.slice(startIndex, endIndex) : filteredRows;

  const handleAdmit = (patientData: MortuaryPatient) => {
    launchWorkspace2('admit-deceased-person-form', {
      patientData,
      // mortuaryLocation,
      mutated,
    });
  };

  const goTo = (page: number) => {
    setCurrentPage(page);
  };

  const handlePaginationChange = ({ page: newPage, pageSize }: { page: number; pageSize: number }) => {
    if (newPage !== currentPage) {
      goTo(newPage);
    }
    if (pageSize !== currPageSize) {
      setCurrPageSize(pageSize);
      setCurrentPage(1);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleDischarge = (patientUuid: string) => {
    if (onDischarge) {
      onDischarge(patientUuid);
    } else {
      launchWorkspace2('discharge-body-form', {
        patientUuid: patientUuid,
        bedId: 0,
        mutate: mutated,
        // mortuaryLocation,
        directDischarge: true
      });
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <DataTableSkeleton columnCount={headers.length} rowCount={5} />
      </div>
    );
  }

  if (!awaitingAdmission || awaitingAdmission.length === 0) {
    return (
      <div>
        <EmptyMorgueAdmission title={t('noDeceasedPatients', 'No deceased patients awaiting admission found')} />
      </div>
    );
  }

  return (
    <div className={styles.bedLayoutWrapper}>
      <Search
        labelText={t('noSearchDeceasedPatients', 'Search deceased patients')}
        placeholder={t('searchPatientsPlaceholder', 'Search by name, ID number, or gender...')}
        value={searchTerm}
        onChange={handleSearchChange}
        size={controlSize}
      />
      {hasNoSearchResults ? (
        <EmptyMorgueAdmission title={t('noSearchResults', 'We couldn’t find anything')} />
      ) : (
        <>
          <DataTable rows={paginatedRows} headers={headers} isSortable useZebraStyles>
            {({ rows, headers, getHeaderProps, getRowProps, getTableProps, getCellProps }) => (
              <TableContainer>
                <Table {...getTableProps()} aria-label="deceased patients table">
                  <TableHead>
                    <TableRow>
                      {headers.map((header) => (
                        <TableHeader
                          key={header.key}
                          {...getHeaderProps({
                            header,
                          })}>
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => {
                      const patientData = awaitingAdmission.find(
                        (patient) => patient?.person?.uuid === row.id,
                      );
                      const patientName = patientData?.person?.display || '';

                      return (
                        <TableRow key={row.id} {...getRowProps({ row })}>
                          {row.cells.map((cell) => (
                            <TableCell key={cell.id} {...getCellProps({ cell })}>
                              {cell.info.header === 'action' ? (
                                <div className={styles.actionButtons}>
                                  <OverflowMenu flipped>
                                    <OverflowMenuItem
                                      onClick={() => handleAdmit(patientData)}
                                      itemText={t('admit', 'Admit')}
                                      disabled={!patientData}
                                    />
                                    <OverflowMenuItem
                                      onClick={() => handleDischarge(patientData.patient.uuid)}
                                      itemText={t('discharge', 'Discharge')}
                                    />
                                  </OverflowMenu>
                                </div>
                              ) : (
                                cell.value
                              )}
                            </TableCell>
                          ))}
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

export default AwaitingBedLineListView;
