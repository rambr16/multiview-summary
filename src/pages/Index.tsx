
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
  const { toast } = useToast();

  const handleFileProcessed = (wb: XLSX.WorkBook, sheets: string[]) => {
    setWorkbook(wb);
    setSheetNames(sheets);
    setSelectedSheets([]);
    setSummaryData([]);
    setFilteredData([]);
    setError(null);
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
        />
      )}
    </div>
  );
};

export default Index;
