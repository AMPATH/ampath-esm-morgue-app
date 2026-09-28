import {
  FetchResponse,
  openmrsFetch,
  type OpenmrsResource,
  restBaseUrl,
  toDateObjectStrict,
  toOmrsIsoString,
  updateVisit,
  useConfig,
  useSession,
  type Visit,
} from '@openmrs/esm-framework';
import useSWR from 'swr';
import {
  EmrApiConfigurationResponse,
  Encounter,
  MappedVisitQueueEntry,
  type PaymentMethod,
  type VisitTypeResponse,
} from '../../types';
import { useCallback, useMemo, useState } from 'react';
import { deceasedPatientAdmitSchema, dischargeFormSchema, DischargeType } from '../../schemas';
import useSWRImmutable from 'swr/immutable';
import { z } from 'zod';
import dayjs from 'dayjs';
import { customRepProps } from '../../constants';
import { BillingConfig, ConfigObject } from '../../config-schema';
import { parseDischargeDateTime } from '../../utils/utils';

export const useVisitType = () => {
  const customRepresentation = 'custom:(uuid,display,name)';
  const url = `${restBaseUrl}/visittype?v=${customRepresentation}`;
  const { data, error, isLoading } = useSWR<FetchResponse<{ results: VisitTypeResponse[] }>>(url, openmrsFetch);
  const visitType = data?.data?.results || null;

  return { data: visitType, error, isLoading };
};

export const useBillableItems = () => {
  const url = `${restBaseUrl}/billing/billableService?v=custom:(uuid,name,shortName,serviceStatus,serviceType:(uuid,display),servicePrices:(uuid,name,price,paymentMode))`;
  const { data, isLoading, error } = useSWR<{ data: { results: Array<OpenmrsResource> } }>(url, openmrsFetch);
  const [searchTerm, setSearchTerm] = useState('');
  const filteredItems =
    data?.data?.results?.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase())) ?? [];
  return {
    lineItems: filteredItems,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
  };
};

export const useCashPoint = () => {
  const url = `/ws/rest/v1/billing/cashPoint`;
  const { data, isLoading, error } = useSWR<{ data: { results: Array<OpenmrsResource> } }>(url, openmrsFetch);

  return { isLoading, error, cashPoints: data?.data?.results ?? [] };
};

export const usePaymentModes = (excludeWaiver: boolean = true) => {
  const { excludedPaymentMode } = useConfig<BillingConfig>();
  const url = `${restBaseUrl}/billing/paymentMode?v=full`;
  const { data, isLoading, error, mutate } = useSWR<{ data: { results: Array<PaymentMethod> } }>(url, openmrsFetch, {
    errorRetryCount: 2,
  });
  const allowedPaymentModes =
    excludedPaymentMode?.length > 0
      ? data?.data?.results.filter((mode) => !excludedPaymentMode.some((excluded) => excluded.uuid === mode.uuid)) ?? []
      : data?.data?.results ?? [];
  return {
    paymentModes: excludeWaiver ? allowedPaymentModes : data?.data?.results,
    isLoading,
    mutate,
    error,
  };
};

const customRep = `custom:${customRepProps.map((prop) => prop.join(':')).join(',')}`;

export default function useEmrConfiguration() {
  const swrData = useSWRImmutable<FetchResponse<EmrApiConfigurationResponse>>(
    `${restBaseUrl}/emrapi/configuration?v=${customRep}`,
    openmrsFetch,
  );

  const results = useMemo(
    () => ({
      emrConfiguration: swrData.data?.data,
      isLoadingEmrConfiguration: swrData.isLoading,
      mutateEmrConfiguration: swrData.mutate,
      errorFetchingEmrConfiguration: swrData.error,
    }),
    [swrData],
  );
  return results;
}

export function removeQueuedPatient(
  queueUuid: string,
  queueEntryUuid: string,
  abortController: AbortController,
  endedAt?: Date,
) {
  return openmrsFetch(`${restBaseUrl}/queue/${queueUuid}/entry/${queueEntryUuid}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      endedAt: toDateObjectStrict(toOmrsIsoString(endedAt) ?? toOmrsIsoString(new Date())),
    },
    signal: abortController.signal,
  });
}

export const useMortuaryOperation = (location?: string) => {
  const { currentProvider } = useSession();
  const { emrConfiguration, isLoadingEmrConfiguration, errorFetchingEmrConfiguration } = useEmrConfiguration();
  const config = useConfig<ConfigObject>();

  const createObservation = (conceptUuid: string | undefined, value: any, formatter?: (val: any) => any) => {
    if (!conceptUuid || !value || (typeof value === 'string' && value.trim() === '')) {
      return null;
    }

    const formattedValue = formatter ? formatter(value) : typeof value === 'string' ? value.trim() : value;
    return { concept: conceptUuid, value: formattedValue };
  };

  const getObservationMappings = (formData: z.infer<typeof deceasedPatientAdmitSchema>) => [
    { uuid: config?.tagNumberUuid, value: formData?.tagNumber, formatter: undefined },
    { uuid: config?.locationOfDeathQuestionUuid, value: formData?.placeOfDeath, formatter: undefined },
    { uuid: config?.deathConfirmationQuestionUuid, value: formData?.deathConfirmed, formatter: undefined },
    { uuid: config?.deathNotificationUuid, value: formData?.deathNotificationNumber, formatter: undefined },

    { uuid: config?.attendingClinicianUuid, value: formData?.attendingClinician, formatter: undefined },
    { uuid: config?.doctorRemarksUuid, value: formData?.doctorsRemarks, formatter: undefined },
    { uuid: config?.causeOfDeathUuid, value: formData?.causeOfDeath, formatter: undefined },
    { uuid: config?.autopsyPermissionUuid, value: formData?.autopsyPermission, formatter: undefined },
    { uuid: config?.deadBodyPreservationQuestionUuid, value: formData?.deadBodyPreservation, formatter: undefined },
    { uuid: config?.deadBodyPreservationQuestionUuid, value: formData?.bodyEmbalmentType, formatter: undefined },

    { uuid: config.obNumberUuid, value: formData.obNumber, formatter: undefined },
    { uuid: config.policeNameUuid, value: formData.policeName, formatter: undefined },
    { uuid: config.policeIDNumber, value: formData.policeIDNo, formatter: undefined },
  ];

  const createMortuaryAdmissionEncounter = useCallback(
    async (patientUuid: string, formData: z.infer<typeof deceasedPatientAdmitSchema>) => {
      const observationMappings = getObservationMappings(formData);
      const obs = observationMappings
        .map(({ uuid, value, formatter }) => createObservation(uuid, value, formatter))
        .filter(Boolean);

      const visitAttributes = [];
      const encounterPayload = {
        visit: {
          patient: patientUuid,
          startDatetime: dayjs(formData.dateOfAdmission).toISOString(),
          visitType: formData.visitType,
          location,
          ...(visitAttributes.length > 0 && { attributes: visitAttributes }),
        },
        patient: patientUuid,
        encounterType: config.morgueAdmissionEncounterTypeUuid,
        location,
        encounterDatetime: dayjs(formData.dateOfAdmission).toISOString(),
        encounterProviders: [
          {
            provider: currentProvider?.uuid,
            encounterRole: emrConfiguration?.clinicianEncounterRole?.uuid,
          },
        ],
        ...(obs.length > 0 && { obs }),
      };

      return openmrsFetch<Encounter>(`${restBaseUrl}/encounter`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: encounterPayload,
      });
    },
    [currentProvider?.uuid, emrConfiguration?.clinicianEncounterRole?.uuid, location, config],
  );

  const getDischargeObservationMappings = (data: z.infer<typeof dischargeFormSchema>) => {
    const baseFields = [
      { uuid: config.burialPermitNumberUuid, value: data.burialPermitNumber },
      { uuid: config.dischargeAreaUuid, value: data.dischargeArea },
    ];

    const transferFields =
      data.dischargeType === 'transfer'
        ? [
          { uuid: config.receivingAreaUuid, value: data.receivingArea },
          { uuid: config.reasonForTransferUuid, value: data.reasonForTransfer },
        ]
        : [];

    const disposeFields =
      data.dischargeType === 'dispose'
        ? [
          { uuid: config.serialNumberUuid, value: data.serialNumber },
          { uuid: config.courtOrderCaseNumberUuid, value: data.courtOrderCaseNumber },
        ]
        : [];

    return [...baseFields, ...transferFields, ...disposeFields];
  };

  const createDischargeEncounter = useCallback(
    async (visit: Visit, data: z.infer<typeof dischargeFormSchema>, encounterDateTime: Date) => {
      const observationMappings = getDischargeObservationMappings(data);
      const obs = observationMappings.map(({ uuid, value }) => createObservation(uuid, value)).filter(Boolean);

      const locationUuid = location ? location : visit?.location?.uuid;

      const encounterPayload = {
        encounterDatetime: encounterDateTime.toISOString(),
        patient: visit?.patient?.uuid,
        encounterType: config.morgueDischargeEncounterTypeUuid,
        location: locationUuid,
        encounterProviders: [
          {
            provider: currentProvider?.uuid,
            encounterRole: emrConfiguration?.clinicianEncounterRole?.uuid,
          },
        ],
        visit: visit?.uuid,
        ...(obs.length > 0 && { obs }),
      };

      return openmrsFetch<Encounter>(`${restBaseUrl}/encounter`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: encounterPayload,
      });
    },
    [config, currentProvider?.uuid, emrConfiguration?.clinicianEncounterRole?.uuid],
  );

  const assignDeceasedToCompartment = useCallback(
    async (patientUuid: string, bedId: number, encounterUuid: string) =>
      openmrsFetch(`${restBaseUrl}/beds/${bedId}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          patientUuid,
          encounterUuid,
        },
      }),
    [],
  );

  const assignPatientToStorageCompartment = useCallback(
    async (patientUuid: string, compartmentUuid: string) =>
      openmrsFetch(`${restBaseUrl}/morgue/storage-assignment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient: patientUuid, compartment: compartmentUuid }),
      }),
    [],
  );

  const admitBody = useCallback(
    async (patientUuid: string, data: z.infer<typeof deceasedPatientAdmitSchema>) => {
      try {
        const admissionEncounter = await createMortuaryAdmissionEncounter(patientUuid, data);
        const compartment = await assignPatientToStorageCompartment(patientUuid, data.availableCompartment);
        return { admissionEncounter, compartment };
      } catch (error) {
        throw error;
      }
    },
    [assignPatientToStorageCompartment, createMortuaryAdmissionEncounter],
  );

  const dischargeStorageAssignment = useCallback(
    async (assignmentUuid: string) =>
      openmrsFetch(`${restBaseUrl}/morgue/storage-assignment/${assignmentUuid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    [],
  );

  const endCurrentVisit = useCallback(
    async (currentVisit: Visit, queueEntry: MappedVisitQueueEntry, stopDateTime: Date) => {
      const abortController = new AbortController();
      const response = await updateVisit(
        currentVisit.uuid,
        {
          stopDatetime: stopDateTime,
        },
        abortController,
      );

      if (queueEntry) {
        removeQueuedPatient(
          queueEntry.queue.uuid,
          queueEntry.queueEntryUuid,
          abortController,
          new Date(response?.data?.stopDatetime),
        );
      }
    },
    [],
  );

  const dischargeBody = useCallback(
    async (
      visit: Visit,
      queueEntry: MappedVisitQueueEntry,
      data: z.infer<typeof dischargeFormSchema>,
      directDischarge: boolean,
      storageAssignmentUuid?: string,
    ) => {
      try {
        if (!directDischarge && !storageAssignmentUuid) {
          throw new Error('Cannot discharge compartment occupancy without a storage assignment UUID.');
        }

        const dischargeDateTime =
          data.dischargeType === 'dispose'
            ? new Date()
            : parseDischargeDateTime({
              ...data,
              dateOfDischarge: data.dateOfDischarge ?? new Date(),
            });

        const dischargeEncounter = await createDischargeEncounter(visit, data, dischargeDateTime);
        const compartment = directDischarge
          ? null
          : await dischargeStorageAssignment(storageAssignmentUuid!);

        return { dischargeEncounter, compartment };
      } catch (error) {
        throw error;
      }
    },
    [createDischargeEncounter, dischargeStorageAssignment, parseDischargeDateTime],
  );

  const createEncounterForCompartmentSwap = useCallback(
    async (patientUuid: string, visitUuid: string) =>
      openmrsFetch<Encounter>(`${restBaseUrl}/encounter`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          encounterDatetime: new Date(),
          patient: patientUuid,
          encounterType: emrConfiguration?.bedAssignmentEncounterType,
          location,
          encounterProviders: [
            {
              provider: currentProvider?.uuid,
              encounterRole: emrConfiguration?.clinicianEncounterRole?.uuid,
            },
          ],
          visit: visitUuid,
          obs: [],
        },
      }),
    [
      currentProvider?.uuid,
      emrConfiguration?.bedAssignmentEncounterType,
      emrConfiguration?.clinicianEncounterRole?.uuid,
      location,
    ],
  );

  return {
    admitBody,
    createEncounterForCompartmentSwap,
    assignDeceasedToCompartment,
    dischargeStorageAssignment,
    dischargeBody,
    isLoadingEmrConfiguration,
    errorFetchingEmrConfiguration,
  };
};

export const createPatientBill = (payload) => {
  const postUrl = `${restBaseUrl}/billing/bill`;
  return openmrsFetch(postUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });
};

export const getPendingVisitBills = async (visitUuid: string) => {
  const url = `${restBaseUrl}/billing/bill?visitUuid=${visitUuid}&status=PENDING&v=custom:(uuid,lineItems)`;
  const response = await openmrsFetch<{ results: Array<{ uuid: string }> }>(url);
  return response.data.results ?? [];
};

export const createBillLineItem = (billUuid: string, payload) => {
  const postUrl = `${restBaseUrl}/billing/bill/${billUuid}/lineItem`;
  return openmrsFetch(postUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  });
};
