import { openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';
import useSWR from 'swr';
import { type Compartment, type StorageAssignment, type StorageUnit } from './types';

const storageUnitUrl = `${restBaseUrl}/morgue/storage-unit`;
const compartmentUrl = `${restBaseUrl}/morgue/compartment`;
const storageAssignmentUrl = `${restBaseUrl}/morgue/storage-assignment`;

export const useStorageUnits = (locationUuid?: string) => {
    const url = locationUuid
        ? `${storageUnitUrl}?location=${encodeURIComponent(locationUuid)}&v=default`
        : null;
    const { data, isLoading, isValidating, error, mutate } = useSWR<{
        data: {
            results: Array<StorageUnit>
        }
    }>(url, openmrsFetch);

    return {
        storageUnits: data?.data?.results ?? [],
        isLoading,
        isValidating,
        error,
        mutate,
    };
};

export const useStorageUnit = (uuid?: string) => {
    const url = uuid ? `${storageUnitUrl}/${uuid}?v=default` : null;
    const { data, isLoading, error, mutate } = useSWR<{ data: StorageUnit }>(url, openmrsFetch);
    return { storageUnit: data?.data, isLoading, error, mutate };
};

export const useCompartments = (storageUnitUuid: string) => {
    const url = storageUnitUuid
        ? `${compartmentUrl}?storageUnit=${encodeURIComponent(storageUnitUuid)}&v=default`
        : null;
    const { data, isLoading, isValidating, error, mutate } = useSWR<{
        data: {
            results: Array<Compartment>
        }
    }>(url, openmrsFetch);

    return {
        compartments: data?.data?.results ?? [],
        isLoading,
        isValidating,
        error,
        mutate,
    };
};

export const useAllCompartments = () => {
    const url = `${compartmentUrl}?v=default`;
    const { data, isLoading, isValidating, error, mutate } = useSWR<{
        data: {
            results: Array<Compartment>
        }
    }>(url, openmrsFetch);

    return {
        compartments: data?.data?.results ?? [],
        isLoading,
        isValidating,
        error,
        mutate,
    };
};

export const useCompartment = (uuid?: string) => {
    const url = uuid ? `${compartmentUrl}/${uuid}?v=default` : null;
    const { data, isLoading, error, mutate } = useSWR<{ data: Compartment }>(url, openmrsFetch);
    return { compartment: data?.data, isLoading, error, mutate };
};

export const useStorageAssignments = (locationUuid?: string, status?: StorageAssignment['status']) => {
    const url = locationUuid
        ? `${storageAssignmentUrl}?location=${encodeURIComponent(locationUuid)}`
        : null;
    const { data, isLoading, isValidating, error, mutate } = useSWR<{
        data: Array<StorageAssignment> | { results: Array<StorageAssignment> }
    }>(url, openmrsFetch);
    const response = data?.data;
    const assignments = Array.isArray(response) ? response : response?.results ?? [];

    const filteredAssignments = status ? assignments?.filter(a => a?.status?.toUpperCase() === status?.toUpperCase()) : assignments;

    return { assignments: filteredAssignments, isLoading, isValidating, error, mutate };
};

export const saveStorageUnit = (payload: { name: string; location: string }, uuid?: string) =>
    openmrsFetch(uuid ? `${storageUnitUrl}/${uuid}` : storageUnitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

export const voidStorageUnit = (uuid: string, reason: string) =>
    openmrsFetch(`${storageUnitUrl}/${uuid}?reason=${encodeURIComponent(reason)}`, {
        method: 'DELETE',
    });

export const purgeStorageUnit = (uuid: string) =>
    openmrsFetch(`${storageUnitUrl}/${uuid}?purge=true`, { method: 'DELETE' });

export const saveCompartment = (payload: { name: string; storageUnit: string }, uuid?: string) =>
    openmrsFetch(uuid ? `${compartmentUrl}/${uuid}` : compartmentUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

export const voidCompartment = (uuid: string, reason: string) =>
    openmrsFetch(`${compartmentUrl}/${uuid}?reason=${encodeURIComponent(reason)}`, {
        method: 'DELETE',
    });

export const purgeCompartment = (uuid: string) =>
    openmrsFetch(`${compartmentUrl}/${uuid}?purge=true`, { method: 'DELETE' });