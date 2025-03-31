
import React, { useMemo } from "react";
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
  weeklyTarget?: number;
}

const SheetSummary: React.FC<SheetSummaryProps> = ({ data, weeklyTarget = 0 }) => {
  if (!data.length) return null;

  const columnsToExclude = ["total_count", "drafted_count"];
  
  // Get filtered column headers from the first data item
  const columns = Object.keys(data[0]).filter(col => !columnsToExclude.includes(col));
  
  // Check if we have unique_sent_count to calculate target difference
  const hasUniqueSentCount = columns.includes('unique_sent_count');
  
  // Add target difference column if we have weekly target and unique_sent_count
  const displayColumns = weeklyTarget > 0 && hasUniqueSentCount 
    ? [...columns, "target_difference"] 
    : columns;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {displayColumns.map((column) => (
              <TableHead key={column} className="whitespace-nowrap">
                {column === "target_difference" 
                  ? "Weekly Target Difference" 
                  : column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i}>
              {displayColumns.map((column) => (
                <TableCell key={`${i}-${column}`} className="whitespace-nowrap">
                  {column === "target_difference" 
                    ? calculateTargetDifference(row, weeklyTarget)
                    : formatCellValue(row[column])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// Helper function to format cell values
const formatCellValue = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return Number(value).toLocaleString();
  return String(value);
};

// Helper function to calculate the difference between weekly target and current unique sent count
const calculateTargetDifference = (row: any, weeklyTarget: number): string => {
  if (!row.unique_sent_count && row.unique_sent_count !== 0) return 'N/A';
  
  const uniqueSent = typeof row.unique_sent_count === 'number' 
    ? row.unique_sent_count 
    : Number(row.unique_sent_count) || 0;
  
  const difference = weeklyTarget - uniqueSent;
  const formattedDifference = Math.abs(difference).toLocaleString();
  
  if (difference > 0) {
    return `Need ${formattedDifference} more`;
  } else if (difference < 0) {
    return `Exceeded by ${formattedDifference}`;
  } else {
    return 'Target met exactly';
  }
};

export default SheetSummary;
