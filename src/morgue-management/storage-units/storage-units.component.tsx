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
    useConfig,
    useLayoutType,
    usePagination,
    type LayoutType,
} from '@openmrs/esm-framework';
import styles from '../morgue-management.scss';
import { useStorageUnits } from '../morgue-management.resource';
import { type StorageUnit } from '../types';
import { ConfigObject } from '../../config-schema';

interface FilterableTableHeaderProps {
    layout: LayoutType;
    handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isValidating: boolean;
    launchStorageUnitForm: () => void;
    responsiveSize: 'sm' | 'md' | 'lg';
    t: (key: string, fallback: string) => string;
}

const StorageUnits = () => {
    const { t } = useTranslation();
    const { storageUnits, isLoading, isValidating, error, mutate } = useStorageUnits();
    const layout = useLayoutType();
    const { pageSize: configuredPageSize } = useConfig<ConfigObject>();
    const [searchString, setSearchString] = useState('');
    const responsiveSize = isDesktop(layout) ? 'lg' : 'sm';
    const pageSizes = [10, 20, 30, 40, 50];
    const [pageSize, setPageSize] = useState(configuredPageSize ?? 10);

    const headerData = [
        {
            header: t('name', 'Name'),
            key: 'name',
        }
    ];

    const launchStorageUnitForm = useCallback(() => {
        launchWorkspace2('storage-unit-form', {
            onWorkspaceClose: mutate,
        });
    }, [mutate]);

    const searchResults: StorageUnit[] = useMemo(() => {
        console.log("storageUnits", storageUnits);
        const flatStorageUnits = Array.isArray(storageUnits) ? storageUnits.flat() : storageUnits;

        if (flatStorageUnits !== undefined && flatStorageUnits.length > 0) {
            const trimmedSearch = searchString.trim();
            if (trimmedSearch) {
                const search = trimmedSearch.toLowerCase();
                return flatStorageUnits.filter((flatStorageUnit) =>
                    Object.entries(flatStorageUnit).some(([header, value]) => {
                        return header === 'uuid' ? false : `${value}`.toLowerCase().includes(search);
                    }),
                );
            }
        }
        return flatStorageUnits;
    }, [searchString, storageUnits]);

    const { paginated, goTo, results, currentPage } = usePagination<StorageUnit>(searchResults, pageSize);
    const rowData = [];

    if (results) {
        results.forEach((result) => {
            const s = {
                id: result.uuid,
                uuid: result.uuid,
                name: result.display
            };
            rowData.push(s);
        });
    }

    const handleSearch = useCallback(
        (e) => {
            goTo(1);
            setSearchString(e.target.value);
        },
        [goTo, setSearchString],
    );

    const handleEdit = useCallback(
        (storageUnit: StorageUnit) => {
            launchWorkspace2('storage-unit-form', {
                storageUnit: storageUnit,
                onWorkspaceClose: mutate,
            });
        },
        [mutate],
    );

    if (isLoading) {
        return (
            <InlineLoading
                status="active"
                iconDescription={getCoreTranslation('loading')}
                description={t('loading', 'Loading data') + '...'}
            />
        );
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
            <DataTable
                isSortable
                rows={rowData}
                headers={headerData}
                overflowMenuOnHover={isDesktop(layout)}
                size={responsiveSize}
                useZebraStyles={rowData?.length > 1}>
                {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
                    <TableContainer>
                        <Table {...getTableProps()} aria-label={t('storageUnitList', 'Storage unit list')}>
                            <TableHead>
                                <TableRow>
                                    {headers.map((header) => (
                                        <TableHeader
                                            {...getHeaderProps({
                                                header,
                                            })}
                                            key={header.key}>
                                            {header.header}
                                        </TableHeader>
                                    ))}
                                    <TableHeader aria-label={getCoreTranslation('actions')} />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        {...getRowProps({
                                            row,
                                        })}>
                                        {row.cells.map((cell) => (
                                            <TableCell key={cell.id}>{cell.value}</TableCell>
                                        ))}
                                        <TableCell className="cds--table-column-menu">
                                            <OverflowMenu size="lg" flipped>
                                                <OverflowMenuItem
                                                    className={styles.menuItem}
                                                    itemText={t('editStorageUnit', 'Edit storage unit')}
                                                    onClick={() => handleEdit(results.find((result) => result.uuid === row.id))}
                                                />
                                            </OverflowMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DataTable>
            {searchResults?.length === 0 && (
                <div className={styles.filterEmptyState}>
                    <Layer level={0}>
                        <Tile className={styles.filterEmptyStateTile}>
                            <p className={styles.filterEmptyStateContent}>
                                {t('noMatchingStorageUnitToDisplay', 'No matching storage unit to display')}
                            </p>
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
                    totalItems={searchResults?.length}
                    className={styles.pagination}
                    size={responsiveSize}
                    onChange={({ pageSize: newPageSize, page: newPage }) => {
                        if (newPageSize !== pageSize) {
                            setPageSize(newPageSize);
                        }
                        if (newPage !== currentPage) {
                            goTo(newPage);
                        }
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
                <div
                    className={classNames({
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
                <Search
                    labelText=""
                    placeholder={t('filterTable', 'Filter table')}
                    onChange={handleSearch}
                    size={responsiveSize}
                />
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