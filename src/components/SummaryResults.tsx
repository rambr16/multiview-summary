
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown } from "lucide-react";
import SheetSummary from "@/components/SheetSummary";
import ClientFilter from "@/components/ClientFilter";
import EmptyState from "@/components/EmptyState";
import { DataRow, downloadCsv } from "@/utils/fileProcessor";

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

  const handleDownloadCsv = () => {
    downloadCsv(filteredData);
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
              data={filteredData} 
              viewType={viewType}
            />
            <div className="mt-4 text-sm text-right text-muted-foreground">
              {`Showing ${filteredData.length} ${filteredData.length === 1 ? "record" : "records"}`}
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
