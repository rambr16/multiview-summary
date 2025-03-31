
import React from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const AppsScriptInfo = () => {
  return (
    <Alert className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>About This App</AlertTitle>
      <AlertDescription>
        <p className="mt-2">
          This is a demo of a Google Apps Script Web App that would allow you to analyze and summarize Google Sheets data.
          In a real implementation, this would connect to Google Sheets API to:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1 text-sm">
          <li>Fetch real sheet data from your Google account</li>
          <li>Process and aggregate data across multiple sheets</li>
          <li>Generate accurate summaries based on your selection</li>
        </ul>
        <p className="mt-2 text-sm font-medium">
          For this demo, we're simulating the API responses with sample data.
        </p>
      </AlertDescription>
    </Alert>
  );
};

export default AppsScriptInfo;
