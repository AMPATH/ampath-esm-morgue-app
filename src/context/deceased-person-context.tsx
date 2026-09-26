import React, { createContext, useContext, ReactNode } from 'react';
import { type Patient, type MortuaryPatient, type EnhancedPatient } from '../types';

interface PatientContextValue {
  isLoading: boolean;
  mutate?: () => void;
  onAdmit?: (patient: EnhancedPatient | MortuaryPatient | Patient) => void;
  onPostmortem?: (patientUuid: string, bedInfo?: { bedNumber: string; bedId: string | number }) => void;
  onDischarge?: (patientUuid: string, compartmentUuid?: string | number, storageAssignmentUuid?: string) => void;
  onSwapCompartment?: (patientUuid: string, compartmentUuid?: string | number) => void;
  onPrintGatePass?: (patient: EnhancedPatient | Patient, encounterDate?: string) => void;
  onViewDetails?: (patientUuid: string, bedInfo?: { bedNumber: string; bedId: string | number }) => void;
}

const PatientContext = createContext<PatientContextValue | undefined>(undefined);

export const usePatientContext = () => {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatientContext must be used within a PatientProvider');
  }
  return context;
};

interface PatientProviderProps {
  children: ReactNode;
  value: PatientContextValue;
}

export const PatientProvider: React.FC<PatientProviderProps> = ({ children, value }) => (
  <PatientContext.Provider value={value}>{children}</PatientContext.Provider>
);
