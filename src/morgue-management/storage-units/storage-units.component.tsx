import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import {
  Button,
  DataTable,
  InlineLoading,
  Layer,
  OverflowMenu,
  OverflowMenuItem,
  Pagination,
  Search,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tile,
} from '@carbon/react';
import { ArrowRight } from '@carbon/react/icons';
import {
  EmptyCard,
  ErrorState,
  getCoreTranslation,
  isDesktop,
  launchWorkspace2,
  showSnackbar,
  useConfig,
  useLayoutType,
  usePagination,
  useSession,
  type LayoutType,
} from '@openmrs/esm-framework';
import styles from '../morgue-management.scss';
import { useStorageUnits, voidStorageUnit } from '../morgue-management.resource';
import { type StorageUnit } from '../types';
import { type ConfigObject } from '../../config-schema';

interface FilterableTableHeaderProps {
  layout: LayoutType;
  handleSearch: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isValidating: boolean;
  launchStorageUnitForm: () => void;
  responsiveSize: 'sm' | 'md' | 'lg';
  t: (key: string, fallback: string) => string;
}

const StorageUnits: React.FC = () => {
  const { t } = useTranslation();
  const session = useSession();
  const { storageUnits, isLoading, isValidating, error, mutate } = useStorageUnits(session?.sessionLocation?.uuid);
  const layout = useLayoutType();
  const { pageSize: configuredPageSize } = useConfig<ConfigObject>();
  const [searchString, setSearchString] = useState('');
  const [pageSize, setPageSize] = useState(configuredPageSize ?? 10);
  const responsiveSize = isDesktop(layout) ? 'lg' : 'sm';
  const pageSizes = [10, 20, 30, 40, 50];

  const launchStorageUnitForm = useCallback(() => {
    launchWorkspace2('storage-unit-form', { onWorkspaceClose: mutate });
  }, [mutate]);

  const searchResults = useMemo(() => {
    const query = searchString.trim().toLowerCase();
    return query
      ? storageUnits.filter((unit) => unit.display.toLowerCase().includes(query))
      : storageUnits;
  }, [searchString, storageUnits]);

  const { paginated, goTo, results, currentPage } = usePagination<StorageUnit>(searchResults, pageSize);
  const rows = results.map((unit) => ({ id: unit.uuid, uuid: unit.uuid, name: unit.display }));
  const headers = [{ header: t('name', 'Name'), key: 'name' }];

  const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    goTo(1);
    setSearchString(event.target.value);
  }, [goTo]);

  const handleEdit = useCallback((storageUnit: StorageUnit) => {
    launchWorkspace2('storage-unit-form', { storageUnit, onWorkspaceClose: mutate });
  }, [mutate]);

  const handleVoid = useCallback(async (storageUnit: StorageUnit) => {
    const reason = window.prompt(t('voidStorageUnitReason', 'Enter a reason for voiding this storage unit'));
    if (!reason?.trim()) return;

    try {
      await voidStorageUnit(storageUnit.uuid, reason.trim());
      await mutate();
      showSnackbar({ kind: 'success', title: t('success', 'Success'), subtitle: t('storageUnitVoided', 'Storage unit voided') });
    } catch (error) {
      showSnackbar({
        kind: 'error',
        title: t('error', 'Error'),
        subtitle: error instanceof Error ? error.message : t('unknownError', 'An unknown error occurred'),
      });
    }
  }, [mutate, t]);

  if (isLoading) {
    return <InlineLoading status="active" iconDescription={getCoreTranslation('loading')} description={t('loading', 'Loading data')} />;
  }
  if (error) {
    return <ErrorState headerTitle={t('storageUnit', 'Storage unit')} error={error} />;
  }
  if (storageUnits.length === 0) {
    return (
      <EmptyCard
        displayText={t('storageUnits__lower', 'storage units')}
        headerTitle={t('storageUnit', 'Storage unit')}
        launchForm={launchStorageUnitForm}
      />
    );
  }

  return (
    <div className={styles.serviceContainer}>
      <FilterableTableHeader
        handleSearch={handleSearch}
        isValidating={isValidating}
        launchStorageUnitForm={launchStorageUnitForm}
        layout={layout}
        responsiveSize={responsiveSize}
        t={t}
      />
      <DataTable rows={rows} headers={headers} isSortable overflowMenuOnHover={isDesktop(layout)} size={responsiveSize}>
        {({ rows: tableRows, headers: tableHeaders, getHeaderProps, getRowProps, getTableProps }) => (
          <TableContainer>
            <Table {...getTableProps()} aria-label={t('storageUnitList', 'Storage unit list')}>
              <TableHead>
                <TableRow>
                  {tableHeaders.map((header) => (
                    <TableHeader {...getHeaderProps({ header })} key={header.key}>
                      {header.header}
                    </TableHeader>
                  ))}
                  <TableHeader aria-label={getCoreTranslation('actions')} />
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows.map((row) => {
                  const item = results.find((unit) => unit.uuid === row.id);
                  return (
                    <TableRow {...getRowProps({ row })}>
                      {row.cells.map((cell) => <TableCell key={cell.id}>{cell.value}</TableCell>)}
                      <TableCell className="cds--table-column-menu">
                        <OverflowMenu size="lg" flipped>
                          <OverflowMenuItem
                            className={styles.menuItem}
                            itemText={t('editStorageUnit', 'Edit storage unit')}
                            onClick={() => item && handleEdit(item)}
                          />
                          <OverflowMenuItem
                            className={styles.menuItem}
                            itemText={t('voidStorageUnit', 'Void storage unit')}
                            onClick={() => item && handleVoid(item)}
                          />
                        </OverflowMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>
      {searchResults.length === 0 && (
        <div className={styles.filterEmptyState}>
          <Layer level={0}>
            <Tile className={styles.filterEmptyStateTile}>
              <p className={styles.filterEmptyStateContent}>{t('noMatchingStorageUnitToDisplay', 'No matching storage unit to display')}</p>
              <p className={styles.filterEmptyStateHelper}>{t('checkFilters', 'Check the filters above')}</p>
            </Tile>
          </Layer>
        </div>
      )}
      {paginated && (
        <Pagination
          forwardText={t('nextPage', 'Next page')}
          backwardText={t('previousPage', 'Previous page')}
          page={currentPage}
          pageSize={pageSize}
          pageSizes={pageSizes}
          totalItems={searchResults.length}
          className={styles.pagination}
          size={responsiveSize}
          onChange={({ pageSize: newPageSize, page: newPage }) => {
            if (newPageSize !== pageSize) setPageSize(newPageSize);
            if (newPage !== currentPage) goTo(newPage);
          }}
        />
      )}
    </div>
  );
};

function FilterableTableHeader({
  layout,
  handleSearch,
  isValidating,
  launchStorageUnitForm,
  responsiveSize,
  t,
}: FilterableTableHeaderProps) {
  return (
    <>
      <div className={styles.headerContainer}>
        <div className={classNames({
          [styles.tabletHeading]: !isDesktop(layout),
          [styles.desktopHeading]: isDesktop(layout),
        })}>
          <h4>{t('storageUnitList', 'Storage unit list')}</h4>
        </div>
        <div className={styles.backgroundDataFetchingIndicator}>
          <span>{isValidating ? <InlineLoading /> : null}</span>
        </div>
      </div>
      <div className={styles.actionsContainer}>
        <Search labelText="" placeholder={t('filterTable', 'Filter table')} onChange={handleSearch} size={responsiveSize} />
        <Button
          size={responsiveSize}
          kind="primary"
          renderIcon={(props) => <ArrowRight size={16} {...props} />}
          onClick={launchStorageUnitForm}
          iconDescription={t('addNewStorageUnit', 'Add new storage unit')}>
          {t('addNewStorageUnit', 'Add new storage unit')}
        </Button>
      </div>
    </>
  );
}

export default StorageUnits;
