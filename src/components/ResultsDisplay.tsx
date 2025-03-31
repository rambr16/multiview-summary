
import React from "react";
import SheetSummary from "@/components/SheetSummary";
import { DataRow } from "@/utils/fileProcessor";

interface ResultsDisplayProps {
  filteredData: DataRow[];
  viewType: "detailed" | "summary";
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ filteredData, viewType }) => {
  if (filteredData.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        No data to display. Please check your filter settings.
      </div>
    );
  }
  
  return (
    <div className="mt-6">
      <SheetSummary 
        data={filteredData} 
        viewType={viewType}
      />
      <div className="mt-4 text-sm text-right text-muted-foreground">
        {`Showing ${filteredData.length} ${filteredData.length === 1 ? "record" : "records"}`}
      </div>
    </div>
  );
};

export default ResultsDisplay;
