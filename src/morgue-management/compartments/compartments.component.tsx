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
    Select,
    SelectItem,
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
import { useStorageUnits, useCompartments, voidCompartment } from '../morgue-management.resource';
import { Compartment, type StorageUnit } from '../types';
import { ConfigObject } from '../../config-schema';

interface FilterableTableHeaderProps {
    layout: LayoutType;
    handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isValidating: boolean;
    launchCompartmentForm: () => void;
    responsiveSize: 'sm' | 'md' | 'lg';
    t: (key: string, fallback: string) => string;
}

const Compartments = () => {
    const { t } = useTranslation();
    const [storageUnitUuid, setStorageUnitUuid] = useState("");
    const session = useSession();
    const { storageUnits } = useStorageUnits(session?.sessionLocation?.uuid);
    const { compartments, isLoading, isValidating, error, mutate } = useCompartments(storageUnitUuid);
    const layout = useLayoutType();
    const { pageSize: configuredPageSize } = useConfig<ConfigObject>();
    const [searchString, setSearchString] = useState('');
    const responsiveSize = isDesktop(layout) ? 'lg' : 'sm';
    const pageSizes = [10, 20, 30, 40, 50];
    const [pageSize, setPageSize] = useState(configuredPageSize ?? 10);

    React.useEffect(() => {
        if (!storageUnitUuid && storageUnits.length === 1) {
            setStorageUnitUuid(storageUnits[0].uuid);
        }
    }, [storageUnitUuid, storageUnits]);

    const headerData = [
        {
            header: t('name', 'Name'),
            key: 'name',
        },
        {
            header: t('status', 'Status'),
            key: 'status',
        }
    ];

    const launchCompartmentForm = useCallback(() => {
        launchWorkspace2('compartment-form', {
            storageUnitUuid,
            onWorkspaceClose: mutate,
        });
    }, [mutate]);

    const searchResults: Compartment[] = useMemo(() => {
        const flatCompartments = Array.isArray(compartments) ? compartments.flat() : compartments;

        if (flatCompartments !== undefined && flatCompartments.length > 0) {
            const trimmedSearch = searchString.trim();
            if (trimmedSearch) {
                const search = trimmedSearch.toLowerCase();
                return flatCompartments.filter((flatCompartment) =>
                    Object.entries(flatCompartment).some(([header, value]) => {
                        return header === 'uuid' ? false : `${value}`.toLowerCase().includes(search);
                    }),
                );
            }
        }
        return flatCompartments;
    }, [searchString, compartments]);

    const { paginated, goTo, results, currentPage } = usePagination<Compartment>(searchResults, pageSize);
    const rowData: Array<{ id: string; uuid: string; name: string; status: string }> = [];
    if (results) {
        results.forEach((result) => {
            const s = {
                id: result.uuid,
                uuid: result.uuid,
                name: result.display,
                status: result.status
            };
            rowData.push(s);
        });
    }

    const handleSearch = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            goTo(1);
            setSearchString(e.target.value);
        },
        [goTo, setSearchString],
    );

    const handleEdit = useCallback(
        (compartment: Compartment) => {
            launchWorkspace2('compartment-form', {
                compartment: compartment,
                onWorkspaceClose: mutate,
            });
        },
        [mutate],
    );

    const handleVoid = useCallback(async (compartment: Compartment) => {
        const reason = window.prompt(t('voidCompartmentReason', 'Enter a reason for voiding this compartment'));
        if (!reason?.trim()) {
            return;
        }

        try {
            await voidCompartment(compartment.uuid, reason.trim());
            await mutate();
            showSnackbar({ kind: 'success', title: t('success', 'Success'), subtitle: t('compartmentVoided', 'Compartment voided') });
        } catch (error) {
            showSnackbar({
                kind: 'error',
                title: t('error', 'Error'),
                subtitle: error instanceof Error ? error.message : t('unknownError', 'An unknown error occurred'),
            });
        }
    }, [mutate, t]);

    if (isLoading) {
        return (
            <InlineLoading
                status="active"
                iconDescription={getCoreTranslation('loading')}
                description={t('loading', 'Loading data') + '....'}
            />
        );
    }

    if (error) {
        return <ErrorState headerTitle={t('compartment', 'Compartment')} error={error} />;
    }

    if (compartments.length === 0) {
        return (
            <div className={styles.serviceContainer}>
                <Select
                    id="compartments-storage-unit"
                    labelText={t('storageUnit', 'Storage unit')}
                    value={storageUnitUuid}
                    onChange={(event) => setStorageUnitUuid(event.target.value)}>
                    <SelectItem value="" text={t('selectStorageUnit', 'Select a storage unit')} />
                    {storageUnits.map((unit) => <SelectItem key={unit.uuid} value={unit.uuid} text={unit.display} />)}
                </Select>
                {storageUnitUuid ? (
                    <EmptyCard
                        displayText={t('compartments__lower', 'Compartments')}
                        headerTitle={t('compartment', 'Compartment')}
                        launchForm={launchCompartmentForm}
                    />
                ) : (
                    <p>{t('selectStorageUnitToViewCompartments', 'Select a storage unit to view or add its compartments.')}</p>
                )}
            </div>
        );
    }

    return (
        <div className={styles.serviceContainer}>
            <Select
                id="compartments-storage-unit"
                labelText={t('storageUnit', 'Storage unit')}
                value={storageUnitUuid}
                onChange={(event) => setStorageUnitUuid(event.target.value)}>
                <SelectItem value="" text={t('selectStorageUnit', 'Select a storage unit')} />
                {storageUnits.map((unit) => <SelectItem key={unit.uuid} value={unit.uuid} text={unit.display} />)}
            </Select>
            <FilterableTableHeader
                handleSearch={handleSearch}
                isValidating={isValidating}
                launchCompartmentForm={launchCompartmentForm}
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
                        <Table {...getTableProps()} aria-label={t('compartmentList', 'Compartment list')}>
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
                                    <TableRow {...getRowProps({ row })}>
                                        {row.cells.map((cell) => (
                                            <TableCell key={cell.id}>{cell.value}</TableCell>
                                        ))}
                                        <TableCell className="cds--table-column-menu">
                                            <OverflowMenu size="lg" flipped>
                                                <OverflowMenuItem
                                                    className={styles.menuItem}
                                                    itemText={t('editCompartment', 'Edit compartment')}
                                                    onClick={() => {
                                                        const compartment = results.find((result) => result.uuid === row.id);
                                                        if (compartment) handleEdit(compartment);
                                                    }}
                                                />
                                                <OverflowMenuItem
                                                    className={styles.menuItem}
                                                    itemText={t('voidCompartment', 'Void compartment')}
                                                    onClick={() => {
                                                        const compartment = results.find((result) => result.uuid === row.id);
                                                        if (compartment) handleVoid(compartment);
                                                    }}
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
                                {t('noMatchingCompartmentToDisplay', 'No matching compartment to display')}
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
    launchCompartmentForm,
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
                    <h4>{t('compartmentList', 'Compartment list')}</h4>
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
                    onClick={launchCompartmentForm}
                    iconDescription={t('addNewCompartment', 'Add new compartment')}>
                    {t('addNewCompartment', 'Add new compartment')}
                </Button>
            </div>
        </>
    );
}

export default Compartments;