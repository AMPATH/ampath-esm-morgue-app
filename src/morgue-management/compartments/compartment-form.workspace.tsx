import React from 'react';
import { Button, ButtonSet, Form, InlineLoading, Select, SelectItem, TextInput } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { showSnackbar, Workspace2 } from '@openmrs/esm-framework';
import { useForm } from 'react-hook-form';
import { useStorageUnits } from '../morgue-management.resource';
import { Compartment } from '../types';
import { saveCompartment } from '../morgue-management.resource';

interface CompartmentFormProps {
  closeWorkspace: (options?: { discardUnsavedChanges?: boolean }) => Promise<boolean>;
  workspaceProps: { compartment?: Compartment; storageUnitUuid?: string; onWorkspaceClose?: () => void } | null;
}

interface CompartmentFormValues {
  name: string;
  storageUnit: string;
}

const CompartmentFormWorkspace: React.FC<CompartmentFormProps> = ({ closeWorkspace, workspaceProps }) => {
  const { t } = useTranslation();
  const { compartment, storageUnitUuid, onWorkspaceClose } = workspaceProps ?? {};
  const { storageUnits, isLoading: isLoadingStorageUnits, error } = useStorageUnits();
  const initialStorageUnitUuid = compartment?.storageUnit?.uuid ?? storageUnitUuid ?? '';
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompartmentFormValues>({
    defaultValues: {
      name: compartment?.display ?? '',
      storageUnit: initialStorageUnitUuid,
    },
  });

  const onSubmit = async ({ name, storageUnit }: CompartmentFormValues) => {
    try {
      await saveCompartment({ name: name.trim(), storageUnit }, compartment?.uuid);
      showSnackbar({
        kind: 'success',
        title: t('success', 'Success'),
        subtitle: compartment
          ? t('compartmentUpdated', 'Compartment updated.')
          : t('compartmentCreated', 'Compartment created.'),
      });
      onWorkspaceClose?.();
      await closeWorkspace({ discardUnsavedChanges: true });
    } catch (error) {
      showSnackbar({
        kind: 'error',
        title: t('error', 'Error'),
        subtitle: error instanceof Error ? error.message : t('unknownError', 'An unknown error occurred'),
      });
    }
  };

  return (
    <Workspace2 title={compartment ? t('editCompartment', 'Edit compartment') : t('addNewCompartment', 'Add new compartment')}>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <TextInput
          id="compartment-name"
          labelText={t('name', 'Name')}
          invalid={Boolean(errors.name)}
          invalidText={errors.name?.message}
          {...register('name', { required: t('nameRequired', 'Name is required') })}
        />
        <Select
          id="compartment-storage-unit"
          labelText={t('storageUnit', 'Storage unit')}
          invalid={Boolean(errors.storageUnit) || Boolean(error)}
          invalidText={errors.storageUnit?.message ?? (error ? t('errorLoadingStorageUnits', 'Unable to load storage units') : undefined)}
          disabled={isLoadingStorageUnits || storageUnits.length === 0}
          {...register('storageUnit', { required: t('storageUnitRequired', 'Select a storage unit') })}>
          <SelectItem value="" text={isLoadingStorageUnits ? t('loading', 'Loading...') : t('selectStorageUnit', 'Select a storage unit')} />
          {storageUnits.map((unit) => (
            <SelectItem key={unit.uuid} value={unit.uuid} text={unit.display} />
          ))}
        </Select>
        <ButtonSet>
          <Button kind="secondary" type="button" onClick={() => closeWorkspace({ discardUnsavedChanges: true })}>
            {t('cancel', 'Cancel')}
          </Button>
          <Button kind="primary" type="submit" disabled={isSubmitting || isLoadingStorageUnits || storageUnits.length === 0}>
            {isSubmitting ? <InlineLoading description={t('saving', 'Saving')} /> : t('saveAndClose', 'Save and close')}
          </Button>
        </ButtonSet>
      </Form>
    </Workspace2>
  );
};

export default CompartmentFormWorkspace;
