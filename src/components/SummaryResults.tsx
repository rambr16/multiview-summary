
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ClientFilter from "@/components/ClientFilter";
import EmptyState from "@/components/EmptyState";
import { DataRow } from "@/utils/fileProcessor";
import SheetSummary from "@/components/SheetSummary";
import DownloadButton from "@/components/DownloadButton";
import ResultsDisplay from "@/components/ResultsDisplay";

interface SummaryResultsProps {
  summaryData: DataRow[];
  filteredData: DataRow[];
  setFilteredData: (data: DataRow[]) => void;
  viewType: "detailed" | "summary";
  setViewType: (type: "detailed" | "summary") => void;
  selectedClient: string | null;
  setSelectedClient: (client: string | null) => void;
}

const SummaryResults: React.FC<SummaryResultsProps> = ({
  summaryData,
  filteredData,
  setFilteredData,
  viewType,
  selectedClient,
  setSelectedClient
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
        <ClientFilter 
          data={summaryData}
          onFilter={handleClientFilter}
          selectedClient={selectedClient}
        />
        
        <ResultsDisplay 
          filteredData={filteredData} 
          viewType={viewType} 
        />
      </CardContent>
    </Card>
  );
};

export default SummaryResults;
