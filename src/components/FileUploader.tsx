
import React, { useState } from "react";
import { Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { processWorkbook } from "@/utils/fileProcessor";
import * as XLSX from 'xlsx';

interface FileUploaderProps {
  onFileProcessed: (workbook: XLSX.WorkBook, sheetNames: string[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileProcessed }) => {
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      
      const workbook = await processWorkbook(file);
      const sheets = workbook.SheetNames;
      
      onFileProcessed(workbook, sheets);
      
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

  return (
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
  );
};

export default FileUploader;
