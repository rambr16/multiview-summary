
import React from "react";
import { InfoIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const AppsScriptInfo = () => {
  return (
    <Alert className="mb-6">
      <InfoIcon className="h-4 w-4" />
      <AlertTitle>Workbook Analyzer</AlertTitle>
      <AlertDescription>
        <p className="mt-2">
          Upload your CSV or Excel files to analyze and summarize the data. This tool helps you:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1 text-sm">
          <li>Process CSV and Excel files including multiple sheets</li>
          <li>Select specific sheets or sections to analyze</li>
          <li>Generate comprehensive data summaries</li>
          <li>Export results for further use</li>
        </ul>
      </AlertDescription>
    </Alert>
  );
};

export default AppsScriptInfo;
