import { InlineLoading } from '@carbon/react';
import { ExtensionSlot, useConnectivity, usePatient, Workspace2 } from '@openmrs/esm-framework';
import React, { useMemo } from 'react';

interface FormEntryWorkspaceProps {
  closeWorkspace: (options?: { discardUnsavedChanges?: boolean }) => Promise<boolean>;
  workspaceProps: {
    formUuid?: string;
    patientUuid?: string;
    encounterUuid?: string;
    mutateForm?: () => void;
    workspaceTitle?: string;
    [key: string]: unknown;
  } | null;
}

const FormEntryWorkspace: React.FC<FormEntryWorkspaceProps> = (props) => {
  const { closeWorkspace, workspaceProps } = props;
  const { formUuid, patientUuid, encounterUuid, mutateForm, workspaceTitle } = workspaceProps ?? {};
  const { patient, isLoading } = usePatient(patientUuid);
  const isOnline = useConnectivity();
  const state = useMemo(
    () => ({
      ...workspaceProps,
      view: 'form',
      formUuid: formUuid ?? null,
      visitUuid: '',
      visitTypeUuid: '',
      visitStartDatetime: null,
      visitStopDatetime: null,
      isOffline: !isOnline,
      patientUuid: patientUuid ?? null,
      patient,
      encounterUuid: encounterUuid ?? null,
      closeWorkspace: () => {
        typeof mutateForm === 'function' && mutateForm();
        closeWorkspace();
      },
      closeWorkspaceWithSavedChanges: () => {
        typeof mutateForm === 'function' && mutateForm();
        closeWorkspace({ discardUnsavedChanges: true });
      },
    }),
    [
      patient,
      patientUuid,
      encounterUuid,
      formUuid,
      isOnline,
      workspaceProps,
      closeWorkspace,
      mutateForm,
    ],
  );

  return (
    <Workspace2 title={workspaceTitle ?? 'Mortuary form entry'}>
      {isLoading ? (
        <div>
          <InlineLoading status="active" iconDescription="Loading" description="Loading form..." />
        </div>
      ) : (
        <ExtensionSlot name="form-widget-slot" state={state} />
      )}
    </Workspace2>
  );
};

export default FormEntryWorkspace;
