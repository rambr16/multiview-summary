
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown } from "lucide-react";
import SheetSummary from "@/components/SheetSummary";
import ClientFilter from "@/components/ClientFilter";
import EmptyState from "@/components/EmptyState";
import { DataRow, downloadCsv, generateSummaryView } from "@/utils/fileProcessor";

interface SummaryResultsProps {
  summaryData: DataRow[];
  filteredData: DataRow[];
  setFilteredData: (data: DataRow[]) => void;
  viewType: "detailed" | "summary";
  setViewType: (type: "detailed" | "summary") => void;
}

const SummaryResults: React.FC<SummaryResultsProps> = ({
  summaryData,
  filteredData,
  setFilteredData,
  viewType,
  setViewType
}) => {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

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

  // Generate appropriate data for the current view
  const summaryViewData = viewType === "summary" 
    ? generateSummaryView(filteredData)
    : [];

  const detailedViewData = viewType === "detailed" 
    ? filteredData
    : [];

  const handleDownloadCsv = () => {
    if (viewType === "summary") {
      downloadCsv(summaryViewData);
    } else {
      downloadCsv(filteredData);
    }
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
        <Button
          onClick={handleDownloadCsv}
          variant="outline"
          size="sm"
        >
          <FileDown className="mr-2 h-4 w-4" /> Download CSV
        </Button>
      </CardHeader>
      <CardContent>
        <ClientFilter 
          data={summaryData}
          onFilter={handleClientFilter}
          selectedClient={selectedClient}
        />
        
        {filteredData.length > 0 ? (
          <div className="mt-6">
            <SheetSummary 
              data={summaryViewData} 
              detailedData={detailedViewData}
              viewType={viewType}
              setViewType={setViewType}
            />
            <div className="mt-4 text-sm text-right text-muted-foreground">
              {`Showing ${(viewType === "summary" ? summaryViewData.length : detailedViewData.length)} ${viewType === "summary" ? "summarized" : ""} ${(viewType === "summary" ? summaryViewData.length : detailedViewData.length) === 1 ? "record" : "records"}`}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            No data to display. Please check your filter settings.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SummaryResults;
