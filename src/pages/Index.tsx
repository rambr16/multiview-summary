
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SheetSummary from "@/components/SheetSummary";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import AppsScriptInfo from "@/components/AppsScriptInfo";
import { useToast } from "@/hooks/use-toast";
import { FileDown, Upload } from "lucide-react";
import * as XLSX from 'xlsx';

interface DataRow {
  [key: string]: string | number;
}

const Index = () => {
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [summaryData, setSummaryData] = useState<DataRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if the file is a CSV or Excel file
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!(fileExt === 'csv' || fileExt === 'xlsx' || fileExt === 'xls')) {
      setError("Please upload a CSV or Excel file (.csv, .xlsx, .xls)");
      return;
    }

    try {
      setIsProcessingFile(true);
      setError(null);
      setSummaryData([]);
      
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      setWorkbook(wb);
      
      // Get all sheet names from the workbook
      const sheets = wb.SheetNames;
      
      setSheetNames(sheets);
      setSelectedSheets([]);
      
      toast({
        title: "File loaded successfully",
        description: `Found ${sheets.length} ${sheets.length === 1 ? 'sheet' : 'sheets'} in the workbook`,
      });
    } catch (err) {
      console.error('Error processing file:', err);
      setError(`Failed to process the file. Please check the file format.`);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleSheetSelection = (sheetName: string) => {
    setSelectedSheets(prev => 
      prev.includes(sheetName) 
        ? prev.filter(name => name !== sheetName)
        : [...prev, sheetName]
    );
  };

  const handleSelectAll = () => {
    if (selectedSheets.length === sheetNames.length) {
      setSelectedSheets([]);
    } else {
      setSelectedSheets([...sheetNames]);
    }
  };

  const generateSummary = async () => {
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
      
      const allData: DataRow[] = [];
      
      // Process each selected sheet
      for (const sheetName of selectedSheets) {
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert the worksheet to JSON
        const sheetData = XLSX.utils.sheet_to_json<DataRow>(worksheet, { defval: '' });
        
        // Filter out empty rows and add to the collection
        const validRows = sheetData.filter(row => {
          // Check if any key has a non-empty value
          return Object.values(row).some(val => val !== '');
        });
        
        allData.push(...validRows);
      }
      
      // Process the data to ensure proper types
      const processedData = allData.map(row => {
        const processedRow: DataRow = {};
        
        // Convert numeric strings to numbers for specific fields
        const numericFields = [
          'sent_count', 'unique_sent_count', 'positive_reply_count', 
          'reply_count', 'bounce_count'
        ];
        
        Object.keys(row).forEach(key => {
          if (numericFields.includes(key) && typeof row[key] === 'string') {
            const numValue = parseFloat(row[key] as string);
            processedRow[key] = isNaN(numValue) ? 0 : numValue;
          } else {
            processedRow[key] = row[key];
          }
        });
        
        return processedRow;
      });
      
      setSummaryData(processedData);
      
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

  const downloadCsv = () => {
    if (summaryData.length === 0) return;
    
    try {
      // Create a new workbook for export
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(summaryData);
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, "Summary");
      
      // Generate and download the file
      XLSX.writeFile(wb, "workbook_summary.csv");
      
      toast({
        title: "Download started",
        description: "Your CSV file is being downloaded",
      });
    } catch (err) {
      console.error('Error downloading CSV:', err);
      setError("Failed to download CSV file. Please try again.");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <h1 className="text-3xl font-bold text-center mb-8">
        Workbook Summary Generator
      </h1>
      
      <AppsScriptInfo />
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Step 1: Upload Workbook File</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center w-full">
              <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-3 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">CSV or Excel files (.csv, .xlsx, .xls)</p>
                </div>
                <input 
                  id="file-upload" 
                  type="file" 
                  accept=".csv,.xlsx,.xls" 
                  className="hidden" 
                  onChange={handleFileUpload} 
                  disabled={isProcessingFile}
                />
              </label>
            </div>
          </div>
          {isProcessingFile && <div className="mt-4"><LoadingSpinner message="Reading file contents..." /></div>}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {sheetNames.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Step 2: Select Sheets</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSelectAll}
            >
              {selectedSheets.length === sheetNames.length ? "Deselect All" : "Select All"}
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] rounded border p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {sheetNames.map((name) => (
                  <div key={name} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`sheet-${name}`}
                      checked={selectedSheets.includes(name)}
                      onCheckedChange={() => handleSheetSelection(name)}
                    />
                    <Label htmlFor={`sheet-${name}`} className="truncate">{name}</Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={generateSummary} 
                disabled={isLoading || selectedSheets.length === 0}
              >
                {isLoading ? "Generating..." : "Generate Summary"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {isLoading ? (
        <LoadingSpinner message="Analyzing sheet data..." />
      ) : summaryData.length > 0 ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Summary Report</CardTitle>
            <Button
              onClick={downloadCsv}
              variant="outline"
              size="sm"
            >
              <FileDown className="mr-2 h-4 w-4" /> Download CSV
            </Button>
          </CardHeader>
          <CardContent>
            <SheetSummary data={summaryData} />
          </CardContent>
        </Card>
      ) : sheetNames.length > 0 ? (
        <EmptyState
          title="No summary generated yet"
          description="Select sheets and generate a summary to see results"
        />
      ) : null}
    </div>
  );
};

export default Index;
