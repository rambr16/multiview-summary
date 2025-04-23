
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ClientFilter from "@/components/ClientFilter";
import EmptyState from "@/components/EmptyState";
import { DataRow } from "@/utils/fileProcessor";
import SheetSummary from "@/components/SheetSummary";
import DownloadButton from "@/components/DownloadButton";
import ResultsDisplay from "@/components/ResultsDisplay";
import ExecutiveSummary from "@/components/ExecutiveSummary";

interface SummaryResultsProps {
  summaryData: DataRow[];
  filteredData: DataRow[];
  setFilteredData: (data: DataRow[]) => void;
  viewType: "detailed" | "summary";
  setViewType: (type: "detailed" | "summary") => void;
  selectedClient: string | null;
  setSelectedClient: (client: string | null) => void;
  amData?: DataRow[]; // NEW: amData may be undefined
}

const SummaryResults: React.FC<SummaryResultsProps> = ({
  summaryData,
  filteredData,
  setFilteredData,
  viewType,
  selectedClient,
  setSelectedClient,
  setViewType,
  amData = [],
}) => {
  const handleClientFilter = (client: string | null) => {
    setSelectedClient(client);
    
    if (!client) {
      setFilteredData(summaryData);
      return;
    }
    // Find the key that contains client information
    const clientField = Object.keys(summaryData[0] || {}).find(key => 
      key.toLowerCase().includes('client')
    );
    if (!clientField) {
      setFilteredData(summaryData);
      return;
    }
    // Only show data for the selected client
    const filtered = summaryData.filter(row => row[clientField] === client);
    setFilteredData(filtered);
  };

  if (!summaryData.length) {
    return (
      <EmptyState
        title="No summary generated yet"
        description="Select sheets and generate a summary to see results"
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Summary Report</CardTitle>
        <DownloadButton 
          data={filteredData} 
          selectedClient={selectedClient} 
          summaryData={summaryData}
        />
      </CardHeader>
      <CardContent>
        {amData.length > 0 && !selectedClient && (
          <div className="mb-8">
            <ExecutiveSummary summaryData={summaryData} amData={amData} />
          </div>
        )}
        <ClientFilter 
          data={summaryData}
          onFilter={handleClientFilter}
          selectedClient={selectedClient}
        />
        <SheetSummary 
          data={filteredData} 
          viewType={viewType}
          selectedClient={selectedClient}
          fullData={summaryData}
        />
      </CardContent>
    </Card>
  );
};

export default SummaryResults;
