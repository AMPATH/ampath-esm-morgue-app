import { Type } from '@openmrs/esm-framework';
import _default from 'react-hook-form/dist/utils/createSubject';

export const configSchema = {
  mortuaryLocationTagUuid: { //
    _type: Type.String,
    _description: 'UUID for mortuary location tag',
    _default: '2b3bbabb-37cd-4cbe-af09-87779bde91c0',
  },
  morgueVisitTypeUuid: { //
    _type: Type.String,
    _description: ' UUID for morgue visit',
    _default: '02b67c47-6071-4091-953d-ad21452e830c',
  },
  morgueDepartmentServiceTypeUuid: {
    _type: Type.String,
    _description: ' UUID for morgue department service type',
    _default: '6c28b299-2e99-43c2-9156-1dd77f789661',
  },
  insurancepaymentModeUuid: {
    _type: Type.String,
    _description: ' UUID for insurance payment mode',
    _default: 'beac329b-f1dc-4a33-9e7c-d95821a137a6',
  },

  tagNumberUuid: {
    _type: Type.String,
    _description: 'UUID for tag number concept',
    _default: '2ddd09a1-c266-419a-b8d6-3cdb649dac19',
  },
  morgueAdmissionEncounterTypeUuid: {
    _type: Type.String,
    _description: 'Encounter type for morgue admission',
    _default: 'bd9f341f-6ba9-443a-8f6f-4288c0a82e19',
  },
  morgueDischargeEncounterTypeUuid: { //
    _type: Type.String,
    _description: 'Encounter type for morgue discharge',
    _default: '3d618f40b-b5a3-4f17-81c8-2f04e2aad58e',
  },
  nextOfKinNameUuid: { //
    _type: Type.String,
    _description: 'UUID for next of kin name concept',
    _default: '830bef6d-b01f-449d-9f8d-ac0fede8dbd3',
  },
  nextOfKinRelationshipUuid: { //
    _type: Type.String,
    _description: 'UUID for next of kin relationship concept',
    _default: 'd0aa9fd1-2ac5-45d8-9c5e-4317c622c8f5',
  },
  nextOfKinNationalIdUuid: {
    _type: Type.String,
    _description: 'UUID for next of kin national ID concept',
    _default: '73d34479-2f9e-4de3-a5e6-1f79a17459bb',
  },
  nextOfKinPhoneUuid: { 
    _type: Type.String,
    _description: 'UUID for next of kin phone concept',
    _default: '342a1d39-c541-4b29-8818-930916f4c2dc',
  },
  visitPaymentMethodAttributeUuid: {
    _type: Type.String,
    _description: 'UUID for visit payment method attribute',
    _default: 'e6cb0c3b-04b0-4117-9bc6-ce24adbda802',
  },
  obNumberUuid: { // - concept
    _type: Type.String,
    _description: 'UUID for ob number concept',
    _default: '0dffecb3-2dc4-4d56-8cd4-56ba38579c69',
  },
  policeNameUuid: { //- concept
    _type: Type.String,
    _description: 'UUID for police name concept',
    _default: 'd889f05b-0d9b-462f-ae8e-2e9be79fd954',
  },
  burialPermitNumberUuid: { // - concept
    _type: Type.String,
    _description: 'UUID for burial permit number concept',
    _default: 'da524812-5600-4677-ba26-eb61eb925eef',
  },
  policeIDNumber: { // - concept
    _type: Type.String,
    _description: 'UUID for police id number concept',
    _default: '163084AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  },
  encounterProviderRoleUuid: {
    _type: Type.UUID,
    _default: 'a0b03050-c99b-11e0-9572-0800200c9a66',
    _description: "The provider role to use for the registration encounter. Default is 'Unkown'.",
  },
  dischargeAreaUuid: { // - concept
    _type: Type.String,
    _description: 'UUID for discharge area concept',
    _default: '89ebccf1-4cca-4195-aeff-3e75fdf976b4',
  },
  adminUuid: {
    _type: Type.String,
    _description: 'UUID for admin user',
    _default: 'e02c40e5-04e7-11e5-ae3c-a0b3cc4f922f',
  },
  autopsyFormUuid: { // - Form
    _type: Type.String,
    _description: 'UUID for autopsy form',
    _default: '2b61a73-4971-4fc0-b20b-9a30176317e2',
  },
  autopsyEncounterFormUuid: {
    _type: Type.String,
    _description: 'Encounter UUID for autopsy',
    _default: '465a92f2-baf8-42e9-9612-53064be868e8',
  },
  courtOrderCaseNumberUuid: { // - concept
    _type: Type.String,
    _description: 'UUID for court order case number concept',
    _default: '26e0da6c-3e53-4f7d-9a3a-1c2f634450f7',
  },
  serialNumberUuid: { // - concept
    _type: Type.String,
    _description: 'UUID for serial number concept',
    _default: '1646AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  },
  receivingAreaUuid: { // - concept
    _type: Type.String,
    _description: 'UUID for receiving area concept',
    _default: '159495AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  },
  reasonForTransferUuid: { // - concept
    _type: Type.String,
    _description: 'UUID for reason for transfer concept',
    _default: '162720AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  },
  locationOfDeathQuestionUuid: {
    _type: Type.String,
    _description: 'UUID for location of death question concept',
    _default: 'a8afd100-1350-11df-a1f1-0026b9348838',
  },
  locationOfDeathTypesList: {
    _type: Type.Array,
    _description: 'List of location of death types',
    _default: [
      {
        concept: 'ff3243bf-05f6-426d-aa49-969034962e45',
        label: 'InPatient',
      },
      {
        concept: 'a8a09ac8-1350-11df-a1f1-0026b9348838',
        label: 'Outpatient',
      },
      {
        concept: '3d6d1ee8-ea5a-4b36-9a24-b05122a0e0c6',
        label: 'Dead on arrival',
      },
      {
        concept: 'a89df17e-1350-11df-a1f1-0026b9348838',
        label: 'Home',
      },
      {
        concept: 'a899b50a-1350-11df-a1f1-0026b9348838',
        label: 'Unknown (Police case)',
      },
    ],
  },
  deathConfirmationTypes: {
    _type: Type.Array,
    _description: 'List of death confirmation types',
    _default: [
      {
        concept: 'a8af9046-1350-11df-a1f1-0026b9348838',
        label: 'Yes',
      },
      {
        concept: '07e9e14e-a718-4a9e-9479-1de79e1f614a',
        label: 'No',
      },
    ],
  },
  deathConfirmationQuestionUuid: {
    _type: Type.String,
    _description: 'UUID for death confirmation question concept',
    _default: '3412be33-1352-4409-bd23-adca170802a3',
  },
  deathNotificationUuid: {
    _type: Type.String,
    _description: 'UUID for death notification concept',
    _default: '2805fed8-5d7e-4fce-b146-c45bd36a664a',
  },
  attendingClinicianUuid: {
    _type: Type.String,
    _description: 'UUID for attending clinician concept',
    _default: '35b08970-c4a2-4e90-a806-1278955ffc9f',
  },
  doctorRemarksUuid: {
    _type: Type.String,
    _description: 'UUID for doctor remarks concept',
    _default: '5e4dc798-2cce-4a1a-97e9-bcf22d64b07c',
  },
  causeOfDeathUuid: {
    _type: Type.String,
    _description: 'UUID for cause of death concept',
    _default: 'e0636302-39ad-449b-8c19-2551447d641d',
  },
  deadBodyPreservationTypeUuid: {
    _type: Type.Array,
    _description: 'List of dead body preservation types',
    _default: [
      {
        concept: '67453ebc-4977-4328-be33-8a733f047b9b',
        label: 'Body embalment',
      },
      {
        concept: '73b68cf4-6f80-41df-b6c6-16045a5ab371',
        label: 'Cold storage',
      },
    ],
  },
  deadBodyPreservationQuestionUuid: {
    _type: Type.String,
    _description: 'UUID for dead body preservation question concept',
    _default: '759e05ff-8bb0-4b32-81b7-f77176335fb4',
  },
  bodyEmbalmmentTypesUuid: {
    _type: Type.Array,
    _description: 'List of body embalmment types',
    _default: [
      {
        concept: '248392d8-f786-44f2-b490-2d8829c0659c',
        label: 'Arterial',
      },
      {
        concept: '5afc3f60-c48e-4522-a959-20d2892ca288',
        label: 'Cavity',
      },
      {
        concept: '3eeac352-2f83-4419-87de-73aea7532b9e',
        label: 'Hypodermic',
      },
    ],
  },
  autopsyPermissionUuid: {
    _type: Type.String,
    _description: 'UUID for autopsy permission concept',
    _default: '9d1f69d7-e467-4d00-a98a-6771009dd244',
  },
};

export interface BillingConfig {
  visitAttributeTypes: {
    isPatientExempted: string;
    paymentMethods: string;
    insuranceScheme: string;
    policyNumber: string;
    exemptionCategory: string;
    billPaymentStatus: string;
  };
  inPatientVisitTypeUuid: string;
  patientExemptionCategories: Array<{ value: string; label: string }>;
  excludedPaymentMode: Array<{ uuid: string; label: string }>;
  enforceBillPayment: boolean;
  billingStatusQueryUrl: string;
  mpesaAPIBaseUrl: string;
  insuranceSchemes: Array<string>;
  nationalPatientUniqueIdentifierTypeUuid: string;
  cashPointUuid: string;
  cashierUuid: string;
  patientBillsUrl: string;
}

export type ConfigObject = {
  morgueVisitTypeUuid: string;
  morgueDepartmentServiceTypeUuid: string;
  insurancepaymentModeUuid: string;
  mortuaryLocationTagUuid: string;
  tagNumberUuid: string;
  morgueAdmissionEncounterTypeUuid: string;
  nextOfKinNameUuid: string;
  nextOfKinRelationshipUuid: string;
  nextOfKinNationalIdUuid: string;
  nextOfKinPhoneUuid: string;
  visitPaymentMethodAttributeUuid: string;
  policeStatementUuid: string;
  obNumberUuid: string;
  encounterProviderRoleUuid: string;
  policeNameUuid: string;
  burialPermitNumberUuid: string;
  policeIDNumber: string;
  dischargeAreaUuid: string;
  morgueDischargeEncounterTypeUuid: string;
  adminUuid: string;
  autopsyFormUuid: string;
  autopsyEncounterFormUuid: string;
  courtOrderCaseNumberUuid: string;
  serialNumberUuid: string;
  receivingAreaUuid: string;
  reasonForTransferUuid: string;
  locationOfDeathQuestionUuid: string;
  locationOfDeathTypesList: Array<{ concept: string; label: string }>;
  deathConfirmationTypes: Array<{ concept: string; label: string }>;
  deathConfirmationQuestionUuid: string;
  deathNotificationUuid: string;
  attendingClinicianUuid: string;
  doctorRemarksUuid: string;
  causeOfDeathUuid: string;
  deadBodyPreservationTypeUuid: Array<{ concept: string; label: string }>;
  deadBodyPreservationQuestionUuid: string;
  bodyEmbalmmentTypesUuid: Array<{ concept: string; label: string }>;
  autopsyPermissionUuid: string;
};
