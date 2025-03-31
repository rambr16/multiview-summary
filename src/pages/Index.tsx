import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import SheetSummary from "@/components/SheetSummary";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import AppsScriptInfo from "@/components/AppsScriptInfo";
import ClientFilter from "@/components/ClientFilter";
import { useToast } from "@/hooks/use-toast";
import { FileDown, Upload, Search, Filter, ChevronDown, ChevronUp, X } from "lucide-react";
import * as XLSX from 'xlsx';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface DataRow {
  [key: string]: string | number;
}

const Index = () => {
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [summaryData, setSummaryData] = useState<DataRow[]>([]);
  const [filteredData, setFilteredData] = useState<DataRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [viewType, setViewType] = useState<"detailed" | "summary">("detailed");
  const [weeklyTarget, setWeeklyTarget] = useState<number>(0);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!(fileExt === 'csv' || fileExt === 'xlsx' || fileExt === 'xls')) {
      setError("Please upload a CSV or Excel file (.csv, .xlsx, .xls)");
      return;
    }

    try {
      setIsProcessingFile(true);
      setError(null);
      setSummaryData([]);
      setFilteredData([]);
      
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      setWorkbook(wb);
      
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

  const filteredSheets = useMemo(() => {
    if (!searchTerm) return sheetNames;
    return sheetNames.filter(name => 
      name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sheetNames, searchTerm]);

  const handleSheetSelection = (sheetName: string) => {
    setSelectedSheets(prev => 
      prev.includes(sheetName) 
        ? prev.filter(name => name !== sheetName)
        : [...prev, sheetName]
    );
  };

  const handleSelectAll = () => {
    if (selectedSheets.length === filteredSheets.length) {
      setSelectedSheets([]);
    } else {
      setSelectedSheets([...filteredSheets]);
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
      
      for (const sheetName of selectedSheets) {
        const worksheet = workbook.Sheets[sheetName];
        
        const sheetData = XLSX.utils.sheet_to_json<DataRow>(worksheet, { defval: '' });
        
        const validRows = sheetData.filter(row => {
          return Object.values(row).some(val => val !== '');
        });
        
        allData.push(...validRows);
      }
      
      const processedData = allData.map(row => {
        const processedRow: DataRow = {};
        
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

  const handleClientFilter = (client: string | null) => {
    setSelectedClient(client);
    if (!client) {
      setFilteredData(summaryData);
      return;
    }

    const clientField = summaryData.length > 0 ? 
      (Object.keys(summaryData[0]).find(key => 
        key.toLowerCase().includes('client') && summaryData.some(row => row[key] === client)
      ) || null) : null;

    if (!clientField) {
      setFilteredData(summaryData);
      return;
    }

    const filtered = summaryData.filter(row => row[clientField] === client);
    setFilteredData(filtered);
  };

  const getSummaryView = () => {
    if (!filteredData.length) return [];

    const columns = Object.keys(filteredData[0]);
    const numericColumns = columns.filter(col => 
      !['total_count', 'drafted_count'].includes(col) &&
      (typeof filteredData[0][col] === 'number' || 
       !isNaN(Number(filteredData[0][col])))
    );

    const clientField = columns.find(col => col.toLowerCase().includes('client')) || null;
    
    if (!clientField) {
      const summary: DataRow = { total_records: filteredData.length };
      numericColumns.forEach(col => {
        const sum = filteredData.reduce((acc, row) => {
          const val = typeof row[col] === 'number' ? row[col] : Number(row[col]) || 0;
          return acc + (val as number);
        }, 0);
        summary[col] = sum;
      });
      return [summary];
    } else {
      const clientGroups: { [key: string]: DataRow } = {};
      
      filteredData.forEach(row => {
        const client = String(row[clientField] || 'Unknown');
        if (!clientGroups[client]) {
          clientGroups[client] = { 
            [clientField]: client,
            record_count: 0 
          };
          
          numericColumns.forEach(col => {
            clientGroups[client][col] = 0;
          });
        }
        
        clientGroups[client].record_count = (clientGroups[client].record_count as number) + 1;
        
        numericColumns.forEach(col => {
          if (col === 'record_count') return;
          const val = typeof row[col] === 'number' ? row[col] : Number(row[col]) || 0;
          clientGroups[client][col] = (clientGroups[client][col] as number) + (val as number);
        });
      });
      
      return Object.values(clientGroups);
    }
  };
  
  const summaryViewData = useMemo(() => {
    if (viewType !== "summary") return filteredData;
    return getSummaryView();
  }, [filteredData, viewType]);

  const handleWeeklyTargetChange = (target: number) => {
    setWeeklyTarget(target);
  };

  const downloadCsv = () => {
    if (summaryViewData.length === 0) return;
    
    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(summaryViewData);
      
      XLSX.utils.book_append_sheet(wb, ws, "Summary");
      
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
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
              {selectedSheets.length === filteredSheets.length && filteredSheets.length > 0 ? "Deselect All" : "Select All"}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search sheets..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-8 pr-8"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2.5 top-2.5"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                )}
              </div>
            </div>
            
            {filteredSheets.length > 0 ? (
              <div>
                {filteredSheets.length > 10 ? (
                  <Accordion type="multiple" className="w-full">
                    {Array.from(new Array(Math.ceil(filteredSheets.length / 10))).map((_, groupIndex) => {
                      const groupStart = groupIndex * 10;
                      const groupEnd = Math.min((groupIndex + 1) * 10, filteredSheets.length);
                      const groupSheets = filteredSheets.slice(groupStart, groupEnd);
                      const groupTitle = `Sheets ${groupStart + 1}-${groupEnd}`;
                      
                      return (
                        <AccordionItem key={groupIndex} value={`group-${groupIndex}`}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center justify-between w-full">
                              <span>{groupTitle}</span>
                              <span className="text-sm text-muted-foreground">
                                {groupSheets.filter(name => selectedSheets.includes(name)).length} / {groupSheets.length} selected
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                              {groupSheets.map((name) => (
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
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredSheets.map((name) => (
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
                )}
              </div>
            ) : searchTerm ? (
              <div className="text-center py-8 text-gray-500">No sheets found matching "{searchTerm}"</div>
            ) : (
              <div className="text-center py-8 text-gray-500">No sheets found in workbook</div>
            )}
            
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
            <ClientFilter 
              data={summaryData}
              onFilter={handleClientFilter}
              viewType={viewType}
              onViewTypeChange={setViewType}
              weeklyTarget={weeklyTarget}
              onWeeklyTargetChange={handleWeeklyTargetChange}
            />
            
            {filteredData.length > 0 ? (
              <div className="mt-6">
                <SheetSummary 
                  data={summaryViewData} 
                  weeklyTarget={weeklyTarget}
                />
                <div className="mt-4 text-sm text-right text-muted-foreground">
                  {`Showing ${summaryViewData.length} ${viewType === "summary" ? "summarized" : ""} ${summaryViewData.length === 1 ? "record" : "records"}`}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                No data to display. Please check your filter settings.
              </div>
            )}
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
