
import React from "react";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { DataRow, downloadCsv } from "@/utils/fileProcessor";

interface DownloadButtonProps {
  data: DataRow[];
  selectedClient: string | null;
  summaryData: DataRow[]; // This is all data before filtering
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ 
  data, 
  selectedClient,
  summaryData 
}) => {
  const handleDownloadCsv = () => {
    downloadCsv(data, selectedClient, summaryData);
  };

  return (
    <Button
      onClick={handleDownloadCsv}
      variant="outline"
      size="sm"
    >
      <FileDown className="mr-2 h-4 w-4" /> Download CSV
    </Button>
  );
};

export default DownloadButton;
