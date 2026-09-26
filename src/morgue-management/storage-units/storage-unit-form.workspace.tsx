import React from 'react';
import { Button, ButtonSet, Form, InlineLoading, TextInput } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { showSnackbar, useSession, Workspace2 } from '@openmrs/esm-framework';
import { useForm } from 'react-hook-form';
import { StorageUnit } from '../types';
import { saveStorageUnit } from '../morgue-management.resource';

interface StorageUnitFormProps {
  closeWorkspace: (options?: { discardUnsavedChanges?: boolean }) => Promise<boolean>;
  workspaceProps: { storageUnit?: StorageUnit; onWorkspaceClose?: () => void } | null;
}

interface StorageUnitFormValues {
  name: string;
}

const StorageUnitFormWorkspace: React.FC<StorageUnitFormProps> = ({ closeWorkspace, workspaceProps }) => {
  const { t } = useTranslation();
  const { storageUnit, onWorkspaceClose } = workspaceProps ?? {};
  const session = useSession();
  const location = storageUnit?.location ?? session?.sessionLocation;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StorageUnitFormValues>({ defaultValues: { name: storageUnit?.display ?? '' } });

  const onSubmit = async ({ name }: StorageUnitFormValues) => {
    if (!location?.uuid) {
      showSnackbar({
        kind: 'error',
        title: t('error', 'Error'),
        subtitle: t('sessionLocationRequired', 'Set a session location before creating a storage unit.'),
      });
      return;
    }

    try {
      await saveStorageUnit({ name: name.trim(), location: location.uuid }, storageUnit?.uuid);
      showSnackbar({
        kind: 'success',
        title: t('success', 'Success'),
        subtitle: storageUnit
          ? t('storageUnitUpdated', 'Storage unit updated.')
          : t('storageUnitCreated', 'Storage unit created.'),
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
    <Workspace2 title={storageUnit ? t('editStorageUnit', 'Edit storage unit') : t('addNewStorageUnit', 'Add new storage unit')}>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <TextInput
          id="storage-unit-name"
          labelText={t('name', 'Name')}
          invalid={Boolean(errors.name)}
          invalidText={errors.name?.message}
          {...register('name', { required: t('nameRequired', 'Name is required') })}
        />
        <p>
          {t('location', 'Location')}: {location?.display ?? t('noSessionLocation', 'No session location selected')}
        </p>
        <ButtonSet>
          <Button kind="secondary" type="button" onClick={() => closeWorkspace({ discardUnsavedChanges: true })}>
            {t('cancel', 'Cancel')}
          </Button>
          <Button kind="primary" type="submit" disabled={isSubmitting || !location?.uuid}>
            {isSubmitting ? <InlineLoading description={t('saving', 'Saving')} /> : t('saveAndClose', 'Save and close')}
          </Button>
        </ButtonSet>
      </Form>
    </Workspace2>
  );
};

export default StorageUnitFormWorkspace;
