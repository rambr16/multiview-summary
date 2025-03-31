
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
}

const SheetSummary: React.FC<SheetSummaryProps> = ({ data }) => {
  if (!data.length) return null;
  
  // Get all column headers from the first data item
  const columns = Object.keys(data[0]);
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column} className="whitespace-nowrap">
                {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i}>
              {columns.map((column) => (
                <TableCell key={`${i}-${column}`} className="whitespace-nowrap">
                  {typeof row[column] === 'number' 
                    ? Number(row[column]).toLocaleString() 
                    : row[column]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SheetSummary;
