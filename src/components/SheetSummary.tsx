
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SheetSummaryProps {
  data: any[];
  detailedData?: any[];
  viewType: "detailed" | "summary";
  setViewType: (type: "detailed" | "summary") => void;
}

const SheetSummary: React.FC<SheetSummaryProps> = ({ 
  data, 
  detailedData = [], 
  viewType,
  setViewType
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
  
  // Get columns to display for summary view
  const summaryColumns = data.length > 0 
    ? Object.keys(data[0]).filter(col => !columnsToExclude.includes(col.toLowerCase()))
    : [];
  
  // Get columns to display for detailed view  
  const detailedColumns = detailedData.length > 0
    ? Object.keys(detailedData[0]).filter(col => !columnsToExclude.includes(col.toLowerCase()))
    : [];
    
  const displaySummaryColumns = summaryColumns;
  const displayDetailedColumns = detailedColumns;

  return (
    <div>
      <Tabs 
        defaultValue={viewType} 
        className="w-full" 
        onValueChange={(value) => setViewType(value as "detailed" | "summary")}
      >
        <TabsList className="grid w-[200px] grid-cols-2 mb-4">
          <TabsTrigger value="detailed">Detailed</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>
        
        <TabsContent value="detailed">
          {detailedData.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {displayDetailedColumns.map((column) => (
                      <TableHead key={column} className="whitespace-nowrap">
                        {formatColumnName(column)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailedData.map((row, i) => (
                    <TableRow key={i}>
                      {displayDetailedColumns.map((column) => (
                        <TableCell key={`${i}-${column}`} className="whitespace-nowrap">
                          {formatCellValue(row[column])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              No detailed data available.
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="summary">
          {data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {displaySummaryColumns.map((column) => (
                      <TableHead key={column} className="whitespace-nowrap">
                        {formatColumnName(column)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, i) => (
                    <TableRow key={i}>
                      {displaySummaryColumns.map((column) => (
                        <TableCell key={`${i}-${column}`} className="whitespace-nowrap">
                          {formatCellValue(row[column])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              No summary data available.
            </div>
          )}
        </TabsContent>
      </Tabs>
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
