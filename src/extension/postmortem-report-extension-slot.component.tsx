import React from 'react';
import { ExtensionSlot } from '@openmrs/esm-framework';
import { useHasPostmortemEncounter } from '../home/home.resource';

interface PostmortemReportExtensionSlotProps {
  patientUuid: string;
}

const PostmortemReportExtensionSlot: React.FC<PostmortemReportExtensionSlotProps> = ({ patientUuid }) => {
  const { hasPostmortemEncounter } = useHasPostmortemEncounter(patientUuid);

  if (!hasPostmortemEncounter) {
    return null;
  }

  return <ExtensionSlot name="print-post-mortem-overflow-menu-item-slot" state={{ patientUuid }} />;
};

export default PostmortemReportExtensionSlot;
