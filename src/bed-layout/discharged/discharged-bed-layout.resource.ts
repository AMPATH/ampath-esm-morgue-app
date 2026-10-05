import { useMemo } from 'react';
import { type FetchResponse, fhirBaseUrl, openmrsFetch, restBaseUrl, useConfig, useSession } from '@openmrs/esm-framework';
import useSWR from 'swr';
import { type Patient } from '../../types';
import { type ConfigObject } from '../../config-schema';

export interface MortuaryDischargeEncounter {
  uuid: string;
  patient: { uuid: string; display: string };
  encounterDateTime: string;
  dischargeType: 'discharge' | 'transfer' | 'dispose';
}

interface FhirCoding {
  code?: string;
}

interface FhirCodeableConcept {
  coding?: FhirCoding[];
}

interface FhirEncounterResource {
  resourceType: 'Encounter';
  id: string;
  date?: string;
  period?: { start?: string };
  subject?: { reference?: string; display?: string };
  type?: FhirCodeableConcept[];
  location?: Array<{ location?: { reference?: string } }>;
}

interface FhirObservationResource {
  resourceType: 'Observation';
  encounter?: { reference?: string };
  code?: FhirCodeableConcept;
}

interface FhirBundle {
  entry?: Array<{ resource?: FhirEncounterResource | FhirObservationResource }>;
}

const getReferenceId = (reference?: string) => reference?.split('/').pop();

export const useMortuaryDischargeEncounter = () => {
  const {
    morgueDischargeEncounterTypeUuid,
    serialNumberUuid,
    courtOrderCaseNumberUuid,
    receivingAreaUuid,
    reasonForTransferUuid,
  } = useConfig<ConfigObject>();
  const { sessionLocation } = useSession();
  const locationUuid = sessionLocation?.uuid;
  const url = useMemo(() => {
    if (!morgueDischargeEncounterTypeUuid || !locationUuid) {
      return null;
    }

    const params = new URLSearchParams({
      type: morgueDischargeEncounterTypeUuid,
      location: locationUuid,
      _count: '100',
      _getpagesoffset: '0',
      _revinclude: 'Observation:encounter',
      _sort: '-date',
    });
    return `${fhirBaseUrl}/Encounter?${params.toString()}`;
  }, [morgueDischargeEncounterTypeUuid, locationUuid]);
  const { data, error, isLoading, mutate } = useSWR<FetchResponse<FhirBundle>>(url, openmrsFetch);
  const encounters = useMemo(() => {
    const entries = data?.data?.entry ?? [];
    const observationsByEncounter = new Map<string, FhirObservationResource[]>();
    for (const { resource } of entries) {
      if (resource?.resourceType !== 'Observation') {
        continue;
      }
      const encounterId = getReferenceId(resource.encounter?.reference);
      if (!encounterId) {
        continue;
      }
      observationsByEncounter.set(encounterId, [...(observationsByEncounter.get(encounterId) ?? []), resource]);
    }

    const latestEncounterByPatient = new Map<string, MortuaryDischargeEncounter>();
    for (const { resource } of entries) {
      if (resource?.resourceType !== 'Encounter') {
        continue;
      }

      const patientUuid = getReferenceId(resource.subject?.reference);
      const encounterDateTime = resource.date ?? resource.period?.start;
      if (!patientUuid || !encounterDateTime) {
        continue;
      }

      const existingEncounter = latestEncounterByPatient.get(patientUuid);
      if (
        !existingEncounter ||
        new Date(encounterDateTime).getTime() > new Date(existingEncounter.encounterDateTime).getTime()
      ) {
        const observationConcepts = new Set(
          (observationsByEncounter.get(resource.id) ?? []).flatMap(
            (observation) => observation.code?.coding?.map((coding) => coding.code).filter(Boolean) ?? [],
          ),
        );
        const dischargeType =
          observationConcepts.has(serialNumberUuid) || observationConcepts.has(courtOrderCaseNumberUuid)
            ? 'dispose'
            : observationConcepts.has(receivingAreaUuid) || observationConcepts.has(reasonForTransferUuid)
              ? 'transfer'
              : 'discharge';
        latestEncounterByPatient.set(patientUuid, {
          uuid: resource.id,
          patient: { uuid: patientUuid, display: resource.subject?.display ?? patientUuid },
          encounterDateTime,
          dischargeType,
        });
      }
    }
    return [...latestEncounterByPatient.values()].sort(
      (left, right) => new Date(right.encounterDateTime).getTime() - new Date(left.encounterDateTime).getTime(),
    );
  }, [
    data,
    serialNumberUuid,
    courtOrderCaseNumberUuid,
    receivingAreaUuid,
    reasonForTransferUuid,
  ]);
  const dischargedPatientUuids = useMemo(
    () => [...new Set(encounters.map((encounter) => encounter.patient.uuid))],
    [encounters],
  );

  return {
    encounters,
    dischargedPatientUuids,
    isLoading,
    error,
    mutate,
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
