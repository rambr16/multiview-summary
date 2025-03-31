
import React, { useState, useEffect } from "react";
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

const Index = () => {
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
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
      
      // For demo purposes, we'll simulate processing the file
      // In a real app, we'd use the xlsx library to parse the file
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let mockSheetNames: string[] = [];
      
      if (fileExt === 'csv') {
        // For CSV, we'll mock a single sheet
        mockSheetNames = ["CSV Data"];
      } else {
        // For Excel, we'll mock multiple sheets
        mockSheetNames = ["Sales Data", "Marketing", "HR Records", "Finance", "Customer Feedback"];
      }
      
      setSheetNames(mockSheetNames);
      setSelectedSheets([]);
      setSummaryData([]);
      
      toast({
        title: `${fileExt === 'csv' ? 'CSV' : 'Excel'} file loaded`,
        description: `Found ${mockSheetNames.length} ${mockSheetNames.length === 1 ? 'sheet' : 'sheets'} in the workbook`,
      });
    } catch (err) {
      setError(`Failed to process the ${fileExt === 'csv' ? 'CSV' : 'Excel'} file. Please check the file format.`);
      console.error(err);
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

    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate processing the data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock data - in real app this would be calculated from the file
      const mockSummaryData = [
        {
          client_name: "Acme Inc",
          created_at: "2023-01-15",
          status: "Active",
          name: "Q1 Campaign",
          sent_count: 1250,
          unique_sent_count: 1200,
          positive_reply_count: 85,
          reply_count: 120,
          bounce_count: 30
        },
        {
          client_name: "TechCorp",
          created_at: "2023-02-20",
          status: "Completed",
          name: "Product Launch",
          sent_count: 2500,
          unique_sent_count: 2450,
          positive_reply_count: 210,
          reply_count: 350,
          bounce_count: 45
        },
        {
          client_name: "Global Services",
          created_at: "2023-03-10",
          status: "Active",
          name: "Newsletter",
          sent_count: 5000,
          unique_sent_count: 4850,
          positive_reply_count: 420,
          reply_count: 580,
          bounce_count: 75
        }
      ];
      
      setSummaryData(mockSummaryData);
      
      toast({
        title: "Summary generated",
        description: `Successfully analyzed data from ${selectedSheets.length} sheets`,
      });
    } catch (err) {
      setError("Failed to generate summary");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCsv = () => {
    if (summaryData.length === 0) return;
    
    // Convert JSON to CSV
    const headers = Object.keys(summaryData[0]).join(',');
    const rows = summaryData.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') 
          ? `"${value}"`
          : value
      ).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sheet_summary.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download started",
      description: "Your CSV file is being downloaded",
    });
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
          {isProcessingFile && <div className="mt-4"><LoadingSpinner /></div>}
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
        <LoadingSpinner />
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
