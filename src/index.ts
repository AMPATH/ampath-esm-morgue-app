import {
  getAsyncLifecycle,
  defineConfigSchema,
  getSyncLifecycle,
  registerBreadcrumbs,
  registerFeatureFlag,
} from '@openmrs/esm-framework';
import { configSchema } from './config-schema';
import { createLeftPanelLink } from './left-panel/morgue-left-panel-link.component';
import FormEntryWorkspace from './forms/form-entry-workspace/form-entry-workspace.workspace';
import PrintPostMortemOverflowMenuItem from './extension/overflow-menu-item-postmortem/print-postmorterm-report.component';
import { mortuaryDashboardMeta } from './dashboard.meta';
import MorgueAdminCardLink from './morgue-admin-card-link.component';
import { createAdminLeftPanelLink } from './left-panel/admin/morgue-admin-left-panel-link.component';
import { Archive, Categories } from '@carbon/react/icons';
import MorgueManagementHome from './morgue-management/morgue-management-home.component';
const moduleName = '@ampath/esm-morgue-app';

const options = {
  featureName: 'esm-morgue-app',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  const morgueBasepath = `${window.spaBase}/home/morgue`;

  defineConfigSchema(moduleName, configSchema);
  registerBreadcrumbs([
    {
      title: 'morgue',
      path: morgueBasepath,
      parent: `${window.spaBase}/home`,
    },
  ]);
}

export const root = getAsyncLifecycle(() => import('./root.component'), options);

export const morgueDashboardLink = getSyncLifecycle(
  createLeftPanelLink({
    name: 'morgue',
    title: 'Mortuary',
  }),
  options,
);
export const mortuaryDashboardLink = getSyncLifecycle(createLeftPanelLink({ ...mortuaryDashboardMeta }), options);

export const actionBarButtons = getAsyncLifecycle(() => import('./extension/actionButton.component'), options);
export const bannerInfo = getAsyncLifecycle(() => import('./extension/deceasedInfoBanner.component'), options);
export const admitDeceasedPersonForm = getAsyncLifecycle(
  () => import('./forms/admit-deceased-person-workspace/admit-deceased-person.workspace'),
  options,
);
export const markPersonDeceasedForm = getAsyncLifecycle(
  () => import('./forms/mark-person-deceased-workspace/mark-person-deceased.workspace'),
  options,
);
export const swapForm = getAsyncLifecycle(
  () => import('./forms/swap-compartment-workspace/swap-unit.workspace'),
  options,
);
export const dischargeBodyForm = getAsyncLifecycle(
  () => import('./forms/discharge-deceased-person-workspace/discharge-body.workspace'),
  options,
);
export const morgueDashboard = getAsyncLifecycle(() => import('./home/home.component'), options);
export const mortuaryFormEntry = getSyncLifecycle(FormEntryWorkspace, options);
export const mortuaryChartView = getAsyncLifecycle(() => import('./view-details/main/main.component'), options);
export const printConfirmationModal = getAsyncLifecycle(
  () => import('./modals/mortuary-gate-pass/print-preview-confirmation.modal'),
  options,
);
export const autopsyReportModal = getAsyncLifecycle(
  () => import('./modals/autopsy-report/autopsy-print-preview-confirmation.modal'),
  options,
);

export const printPostMortemOverflowMenuItem = getSyncLifecycle(PrintPostMortemOverflowMenuItem, options);

export const morgueManagementHome = getSyncLifecycle(MorgueManagementHome, options);

export const morgueAdministrationCardLink = getSyncLifecycle(MorgueAdminCardLink, options);

// t('storageUnits', 'Storage units')
export const storageUnitsLeftPanelLink = getSyncLifecycle(
  createAdminLeftPanelLink({
    name: 'storage-units',
    title: 'storageUnits',
    path: 'storage-units',
    icon: Archive,
  }),
  options,
);

// t('compartments', 'Compartments')
export const compartmentsLeftPanelLink = getSyncLifecycle(
  createAdminLeftPanelLink({
    name: 'compartments',
    title: 'compartments',
    path: 'compartments',
    icon: Categories,
  }),
  options,
);
