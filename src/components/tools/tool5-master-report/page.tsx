"use client";

import { Tool5MasterReport } from '@/components/tools/tool5-master-report/tool5-master-report';
import { useSwatStore } from '@/store/swat-store';

export default function Tool5MasterReportPage() {
  const { 
    tool1Data, 
    tool2Data, 
    toolDataForSeoData, 
    tool3Data, 
    tool4Data 
  } = useSwatStore(state => ({
    tool1Data: state.tool1Data,
    tool2Data: state.tool2Data,
    toolDataForSeoData: state.toolDataForSeoData,
    tool3Data: state.tool3Data,
    tool4Data: state.tool4Data,
  }));

  return (
    <Tool5MasterReport
      tool1Data={tool1Data}
      tool2Data={tool2Data}
      toolDataForSeoData={toolDataForSeoData}
      tool3Data={tool3Data}
      tool4Data={tool4Data}
    />
  );
}