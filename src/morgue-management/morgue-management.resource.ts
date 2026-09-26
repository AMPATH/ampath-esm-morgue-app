import { openmrsFetch, restBaseUrl, useSession } from "@openmrs/esm-framework";
import useSWR from 'swr';
import { type Compartment, type StorageUnit } from "./types";

export const useStorageUnits = () => {
    const sessionLocation = useSession();
    const customRepresentation = "custom:(uuid,display)";
    const url = `${restBaseUrl}/morgue/storage-unit?location=${sessionLocation?.sessionLocation?.uuid}&v=${customRepresentation}`;
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

export const useCompartments = (storageUnitUuid: string) => {
    const customRepresentation = "custom:(uuid,display,status)";
    const url = storageUnitUuid ? `${restBaseUrl}/morgue/compartment?storageUnit=${storageUnitUuid}&v=${customRepresentation}` : null;
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