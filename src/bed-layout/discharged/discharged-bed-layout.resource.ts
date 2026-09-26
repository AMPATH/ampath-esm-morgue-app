import { useMemo, useState } from 'react';
import { usePaginationInfo } from '@openmrs/esm-patient-common-lib';
import { type FetchResponse, openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';
import useSWR from 'swr';
import { mutate as mutateSWR } from 'swr';
import { type Patient } from '../../types';
import { type MortuaryLocationResponse } from '../../types';
import { useStorageAssignments } from '../../morgue-management/morgue-management.resource';
import { StorageAssignment } from '../../morgue-management/types';

export const useMortuaryDischargeEncounter = (
  _dischargeEncounterTypeUuid: string,
  assignments: StorageAssignment[],
) => {
  const [currPageSize, setCurrPageSize] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

  const currentPageSize = currPageSize;
  const totalCount = assignments.length;
  const currentItems = Math.max(0, Math.min(currPageSize, totalCount - (currentPage - 1) * currPageSize));
  const { pageSizes, itemsDisplayed } = usePaginationInfo(currPageSize, totalCount, currentPage, currentItems);
  const pageAssignments = useMemo(
    () => assignments.slice((currentPage - 1) * currPageSize, currentPage * currPageSize),
    [assignments, currentPage, currPageSize],
  );

  const dischargedPatientUuids = useMemo(
    () => [...new Set(assignments.map((assignment) => assignment.patient.uuid))],
    [assignments],
  );

  const encounters = useMemo(
    () => assignments.map((assignment) => ({
      uuid: assignment.uuid,
      patient: { uuid: assignment.patient.uuid, name: assignment.patient.display },
      encounterDateTime: assignment.dateDischarged ?? undefined,
      compartment: assignment.compartment,
    })),
    [assignments],
  );

  const paginated = totalCount > currPageSize;
  const goTo = (page: number) => setCurrentPage(Math.max(1, Math.min(page, Math.ceil(totalCount / currPageSize) || 1)));
  const mutateAssignments = () =>
    mutateSWR(
      (key) => typeof key === 'string' && key.includes('/morgue/storage-assignment'),
      undefined,
      { revalidate: true },
    );

  return {
    assignments: pageAssignments,
    encounters,
    dischargedPatientUuids,
    paginated,
    currentPage,
    pageSizes,
    itemsDisplayed,
    goTo,
    currPageSize,
    setCurrPageSize: (pageSize: number) => {
      setCurrPageSize(pageSize);
      setCurrentPage(1);
    },
    totalCount,
    currentPageSize,
    mutate: mutateAssignments,
  };
};

export const usePatients = (uuids: string[]) => {
  const customRepresentation =
    'custom:(uuid,display,identifiers:(uuid,display),person:(uuid,display,gender,birthdate,dead,age,deathDate,causeOfDeath:(uuid,display),attributes:(uuid,display,value,attributeType:(uuid,display))))';
  const urls = uuids.map((uuid) => `${restBaseUrl}/patient/${uuid}?v=${customRepresentation}`);
  const { data, error, isLoading, mutate } = useSWR<FetchResponse<Patient>[]>(urls.length > 0 ? urls : null, (requestUrls: string[]) =>
    Promise.all(requestUrls.map((url: string) => openmrsFetch<Patient>(url))),
  );

  return {
    isLoading,
    error,
    patients: data?.map((response) => response.data)?.filter((patient) => patient?.person?.dead === true),
    mutate,
  };
};

export default usePatients;
