import {
  FetchResponse,
  openmrsFetch,
  restBaseUrl,
  useSession,
} from '@openmrs/esm-framework';
import useSWR from 'swr';
import {
  MappedVisitQueueEntry,
  MortuaryPatient,
  UseVisitQueueEntries,
  VisitQueueEntry,
  MortuaryLocationResponse,
} from '../types';
import React, { useMemo, useEffect, useState } from 'react';
import { useStorageAssignments } from '../morgue-management/morgue-management.resource';
import usePatients from '../bed-layout/discharged/discharged-bed-layout.resource';

interface MortuaryApiResponse {
  results: MortuaryPatient[];
}

export const useAwaitingQueuePatients = (admissionLocation?: MortuaryLocationResponse) => {
  const session = useSession();

  const sessionLocationUuid = session?.sessionLocation?.uuid;
  const customRepresentation =
    'custom:(uuid,display,identifiers:(identifier,uuid,preferred,location:(uuid,name)),person:(uuid,display,gender,birthdate,dead,age,deathDate,causeOfDeath:(uuid,display),preferredAddress:(uuid,stateProvince,countyDistrict,address4)))';
  const url = `${restBaseUrl}/morgue/patient?v=${customRepresentation}&locationUuid=${sessionLocationUuid}&dead=true`;
  const { isLoading, error, data, mutate } = useSWR<FetchResponse<MortuaryApiResponse>>(url, openmrsFetch);

  const admissionLocationUuid = admissionLocation?.ward?.uuid;
  const {
    assignments: admittedAssignments,
    isLoading: isLoadingAssignments,
    error: assignmentsError,
    mutate: mutateAssignments,
  } = useStorageAssignments(admissionLocationUuid, 'OCCUPIED');
  const {
    assignments: dischargedAssignments,
    isLoading: isLoadingDischargedAssignments,
    error: dischargedAssignmentsError,
    mutate: mutateDischargedAssignments,
  } = useStorageAssignments(admissionLocationUuid, 'DISCHARGED');

  const dischargedPatientUuids = useMemo(
    () => dischargedAssignments.map((assignment) => assignment.patient.uuid),
    [dischargedAssignments],
  );
  const admittedPatientUuids = useMemo(
    () => admittedAssignments.map((assignment) => assignment.patient.uuid),
    [admittedAssignments],
  );

  const filteredAwaitingPatients = useMemo(() => {
    if (!data?.data?.results) {
      return [];
    }

    return data.data.results.filter((patient, index, self) => {
      const patientUuid = patient?.person?.uuid;
      if (!patientUuid) {
        return false;
      }

      const arrIndex = self.findIndex(v => v.patient?.person?.uuid === patientUuid);
      if(arrIndex !== index) {
        return false;
      }

      if (dischargedPatientUuids.includes(patientUuid)) {
        return false;
      }

      if (admittedPatientUuids.includes(patientUuid)) {
        return false;
      }

      return true;
    });
  }, [data, dischargedPatientUuids, admittedPatientUuids]);

  const admittedPatients = admittedAssignments;
  const dischargedPatients = dischargedAssignments;
  const dischargedPatientsCount = dischargedAssignments.length;

  const mutateAll = React.useCallback(() => {
    mutate();
    mutateAssignments();
    mutateDischargedAssignments();
  }, [mutate, mutateAssignments, mutateDischargedAssignments]);

  return {
    awaitingQueueDeceasedPatients: filteredAwaitingPatients,
    admittedPatients,
    dischargedPatients,
    dischargedPatientsCount,
    isLoadingAwaitingQueuePatients: isLoading,
    isLoadingDischarge: isLoadingDischargedAssignments,
    isLoadingAll: isLoading || isLoadingAssignments || isLoadingDischargedAssignments,
    errorFetchingAwaitingQueuePatients: error || assignmentsError || dischargedAssignmentsError,
    mutateAwaitingQueuePatients: mutateAll,
    mutateAll,
  };
};

export const useStorageAssignmentAdmissionLocation = (location?: MortuaryLocationResponse | null) => {
  const locationUuid = location?.ward?.uuid;
  const {
    assignments,
    isLoading: isLoadingAssignments,
    error: assignmentsError,
    mutate: mutateAssignments,
  } = useStorageAssignments(locationUuid, 'OCCUPIED');
  const patientUuids = useMemo(() => assignments.map((assignment) => assignment.patient.uuid), [assignments]);
  const { patients, isLoading: isLoadingPatients, error: patientsError, mutate: mutatePatients } = usePatients(patientUuids);

  const assignmentLocation = useMemo(() => {
    if (!location) return null;

    const patientsByUuid = new Map((patients ?? []).map((patient) => [patient.uuid, patient]));
    const bedLayouts = assignments.flatMap((assignment, index) => {
      const patient = patientsByUuid.get(assignment.patient.uuid);
      if (!patient) return [];
      const unit = assignment.compartment.storageUnit;
      return [{
        rowNumber: 0,
        columnNumber: index,
        bedNumber: assignment.compartment.display,
        bedId: 0,
        bedUuid: assignment.compartment.uuid,
        status: 'OCCUPIED' as const,
        bedType: {
          uuid: unit?.uuid ?? '',
          display: unit?.display ?? '',
          name: unit?.display ?? '',
          displayName: unit?.display ?? '',
          description: '',
        },
        location: locationUuid ?? '',
        patients: [patient],
        bedTagMaps: [],
        storageAssignmentUuid: assignment.uuid,
      }];
    });

    return { ...location, occupiedBeds: bedLayouts.length, bedLayouts };
  }, [location, locationUuid, assignments, patients]);

  const mutate = React.useCallback(() => {
    mutateAssignments();
    mutatePatients();
  }, [mutateAssignments, mutatePatients]);

  return {
    admissionLocation: assignmentLocation,
    isLoading: isLoadingAssignments || isLoadingPatients,
    error: assignmentsError || patientsError,
    mutate,
  };
};

/**
 * Custom hook specifically for awaiting patients (patients without active visits or beds)
 * This hook is now simplified since the filtering is done upstream
 * @param patients - Array of mortuary patients (already filtered by useAwaitingQueuePatients)
 * @returns The same array of patients (already filtered upstream)
 */
export const useAwaitingPatients = (patients: MortuaryPatient[]) => {
  // Since useAwaitingQueuePatients already filters out discharged and admitted patients,
  // we can return the patients as-is
  return patients || [];
};

/**
 * Fetches visit data for multiple patients
 * @param patientUuids - Array of patient UUIDs
 * @returns Promise that resolves to a record of visit statuses
 */
const fetchPatientVisits = async (patientUuids: string[]) => {
  const visitPromises = patientUuids.map(async (uuid) => {
    try {
      const response = await openmrsFetch(`${restBaseUrl}/visit?patient=${uuid}&includeInactive=false`);
      return {
        uuid,
        hasActiveVisit: response.data?.results?.length > 0,
      };
    } catch (error) {
      console.error(`Error fetching visit for patient ${uuid}:`, error);
      return { uuid, hasActiveVisit: false };
    }
  });

  const visits = await Promise.all(visitPromises);
  return visits.reduce((acc, { uuid, hasActiveVisit }) => {
    acc[uuid] = hasActiveVisit;
    return acc;
  }, {} as Record<string, boolean>);
};

/**
 * Custom hook to filter mortuary patients based on their visit status
 * @param patients - Array of mortuary patients
 * @returns Object containing filtered patients for different statuses
 */
export const useFilteredPatients = (patients: MortuaryPatient[]) => {
  const [visitData, setVisitData] = useState<Record<string, boolean>>({});
  const patientUuids = useMemo(() => {
    return patients.map((patient) => patient?.person?.uuid).filter(Boolean) as string[];
  }, [patients]);

  useEffect(() => {
    if (patientUuids.length > 0) {
      fetchPatientVisits(patientUuids).then(setVisitData);
    }
  }, [patientUuids]);

  return useMemo(() => {
    if (!patients || patients.length === 0) {
      return {
        awaitingAdmission: [],
        admitted: [],
        all: [],
      };
    }

    const awaitingAdmission: MortuaryPatient[] = [];
    const admitted: MortuaryPatient[] = [];

    patients.forEach((patient) => {
      const patientUuid = patient?.person?.uuid;
      if (!patientUuid) {
        return;
      }

      if (visitData[patientUuid]) {
        admitted.push(patient);
      } else {
        awaitingAdmission.push(patient);
      }
    });

    return {
      awaitingAdmission,
    };
  }, [patients, visitData]);
};

export function useVisitQueueEntry(patientUuid: string, visitUuid: string): UseVisitQueueEntries {
  const apiUrl = `${restBaseUrl}/visit-queue-entry?v=full&patient=${patientUuid}`;
  const { data, error, isLoading, isValidating, mutate } = useSWR<{ data: { results: Array<VisitQueueEntry> } }, Error>(
    apiUrl,
    openmrsFetch,
  );
  const mapVisitQueueEntryProperties = (visitQueueEntry: VisitQueueEntry): MappedVisitQueueEntry => ({
    id: visitQueueEntry.uuid,
    name: visitQueueEntry.queueEntry.queue.display,
    patientUuid: visitQueueEntry.queueEntry.patient.uuid,
    priority:
      visitQueueEntry.queueEntry.priority.display === 'Urgent'
        ? 'Priority'
        : visitQueueEntry.queueEntry.priority.display,
    priorityUuid: visitQueueEntry.queueEntry.priority.uuid,
    service: visitQueueEntry.queueEntry.queue?.display,
    status: visitQueueEntry.queueEntry.status.display,
    statusUuid: visitQueueEntry.queueEntry.status.uuid,
    visitUuid: visitQueueEntry.visit?.uuid,
    visitType: visitQueueEntry.visit?.visitType?.display,
    queue: visitQueueEntry.queueEntry.queue,
    queueEntryUuid: visitQueueEntry.queueEntry.uuid,
  });

  const mappedVisitQueueEntry =
    data?.data?.results
      ?.map(mapVisitQueueEntryProperties)
      .filter((visitQueueEntry) => visitUuid !== undefined && visitUuid === visitQueueEntry.visitUuid)
      .shift() ?? null;
  return {
    queueEntry: mappedVisitQueueEntry,
    isLoading,
    error: error,
    isValidating,
    mutate,
  };
}
