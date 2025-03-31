
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface SheetSummaryProps {
  data: any[];
  detailedData?: any[];
  viewType: "detailed" | "summary";
}

const SheetSummary: React.FC<SheetSummaryProps> = ({ 
  data, 
  detailedData = [], 
  viewType
}) => {
  if (!data.length && !detailedData.length) return null;
  
  // Columns to exclude from display
  const columnsToExclude = [
    "total_count", 
    "drafted_count", 
    "record_count", 
    "id", 
    "user_id",
    "ln_connection_req_pending_count",
    "ln_connection_req_accepted_count",
    "ln_connection_req_skipped_sent_msg_count"
  ];
  
  // Get columns to display based on view type
  const currentData = viewType === "summary" ? data : detailedData;
  
  // Get columns to display
  const displayColumns = currentData.length > 0 
    ? Object.keys(currentData[0]).filter(col => !columnsToExclude.includes(col.toLowerCase()))
    : [];

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {displayColumns.map((column) => (
              <TableHead key={column} className="whitespace-nowrap">
                {formatColumnName(column)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentData.map((row, i) => (
            <TableRow key={i}>
              {displayColumns.map((column) => (
                <TableCell key={`${i}-${column}`} className="whitespace-nowrap">
                  {formatCellValue(row[column])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// Helper function to format column names
const formatColumnName = (column: string): string => {
  return column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Helper function to format cell values
const formatCellValue = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return Number(value).toLocaleString();
  return String(value);
};

export default SheetSummary;
