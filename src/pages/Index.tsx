
import React, { useState } from "react";
import { DataRow, extractSheetData } from "@/utils/fileProcessor";
import FileUploader from "@/components/FileUploader";
import SheetSelector from "@/components/SheetSelector";
import SummaryResults from "@/components/SummaryResults";
import AppsScriptInfo from "@/components/AppsScriptInfo";
import LoadingSpinner from "@/components/LoadingSpinner";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<DataRow[]>([]);
  const [filteredData, setFilteredData] = useState<DataRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [viewType, setViewType] = useState<"detailed" | "summary">("detailed");
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [amData, setAmData] = useState<DataRow[]>([]); // NEW: store AM subsheet data here
  const { toast } = useToast();

  // Extract AM subsheet and store, but do not allow user to select it for the summary data
  const handleFileProcessed = (wb: XLSX.WorkBook, sheets: string[]) => {
    setWorkbook(wb);
    setSheetNames(sheets);
    setSelectedSheets([]);
    setSummaryData([]);
    setFilteredData([]);
    setSelectedClient(null);
    setError(null);

    // Auto-load AM subsheet if present
    const amSheetName = sheets.find(name => name.trim().toUpperCase() === "AM");
    if (amSheetName && wb.Sheets[amSheetName]) {
      const rawAmData = XLSX.utils.sheet_to_json<DataRow>(wb.Sheets[amSheetName], { defval: "" });
      // Filter to rows that have client_name and target set (ignore empty rows)
      const usableAmData = rawAmData.filter(row =>
        row["client_name"] && row["Target"] && row["Account Manager"]
      );
      setAmData(usableAmData);
    } else {
      setAmData([]); // No AM subsheet found
    }
  };

  const handleSelectedSheetsChange = (sheets: string[]) => {
    setSelectedSheets(sheets);
  };

  const handleGenerateSummary = async () => {
    if (selectedSheets.length === 0) {
      setError("Please select at least one sheet");
      return;
    }

    if (!workbook) {
      setError("No file has been loaded");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSelectedClient(null); // Reset client filter when generating new data
      
      const processedData = extractSheetData(workbook, selectedSheets);
      
      setSummaryData(processedData);
      setFilteredData(processedData);
      
      toast({
        title: "Summary generated",
        description: `Successfully analyzed data from ${selectedSheets.length} sheets`,
      });
    } catch (err) {
      console.error('Error generating summary:', err);
      setError("Failed to generate summary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Only pass amData to summary section, no need to touch rest of the flow
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <h1 className="text-3xl font-bold text-center mb-8">
        Workbook Summary Generator
      </h1>
      
      <AppsScriptInfo />
      
      <FileUploader onFileProcessed={handleFileProcessed} />
      
      {sheetNames.length > 0 && (
        <SheetSelector
          sheetNames={sheetNames}
          selectedSheets={selectedSheets}
          onSheetsChange={handleSelectedSheetsChange}
          onGenerateSummary={handleGenerateSummary}
          isLoading={isLoading}
        />
      )}
      
      {isLoading ? (
        <LoadingSpinner message="Analyzing sheet data..." />
      ) : (
        <SummaryResults
          summaryData={summaryData}
          filteredData={filteredData}
          setFilteredData={setFilteredData}
          viewType={viewType}
          setViewType={setViewType}
          selectedClient={selectedClient}
          setSelectedClient={setSelectedClient}
          amData={amData} // NEW PROP
        />
      )}
    </div>
  );
};

export default Index;
