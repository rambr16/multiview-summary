
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from "@/components/ui/table";
import { formatColumnName, formatCellValue, formatMetric, getMetricHighlightColor } from "./formatters";
import { DataRow } from "@/utils/fileTypes";

interface DataTableProps {
  data: DataRow[];
  displayColumns: string[];
  numericColumns: string[];
  summaryTotals: Record<string, number | string>;
}

const DataTable: React.FC<DataTableProps> = ({ 
  data, 
  displayColumns, 
  numericColumns,
  summaryTotals
}) => {
  const hasNumericColumns = numericColumns.length > 0;
  
  // Filter out the columns to hide
  const columnsToHide = [
    'unsubscribed_count', 
    'client_email', 
    'open_count',
    'block_count'
  ];
  
  const filteredDisplayColumns = displayColumns.filter(
    column => !columnsToHide.includes(column) && 
             !columnsToHide.some(col => column.toLowerCase() === col.toLowerCase())
  );

  // Filter rows where unique_sent_count >= 1
  const filteredData = data.filter(row => {
    const uniqueSentCount = Number(row['unique_sent_count']) || 0;
    return uniqueSentCount >= 1;
  });

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {filteredDisplayColumns.map((column) => (
              <TableHead key={column} className="whitespace-nowrap">
                {formatColumnName(column)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((row, i) => (
            <TableRow key={i}>
              {filteredDisplayColumns.map((column) => {
                const highlightColor = ['prr_vs_rr', 'rr', 'bounce_rate', 'unique_leads_per_positive'].includes(column)
                  ? getMetricHighlightColor(column, row[column])
                  : '';
                
                return (
                  <TableCell key={`${i}-${column}`} className={`whitespace-nowrap ${highlightColor}`}>
                    {['prr_vs_rr', 'rr', 'bounce_rate', 'unique_leads_per_positive'].includes(column) 
                      ? formatMetric(column, row[column])
                      : formatCellValue(row[column])}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
        {hasNumericColumns && filteredData.length > 0 && (
          <TableFooter>
            <TableRow>
              {filteredDisplayColumns.map((column) => {
                const highlightColor = numericColumns.includes(column) && 
                  ['prr_vs_rr', 'rr', 'bounce_rate', 'unique_leads_per_positive'].includes(column)
                  ? getMetricHighlightColor(column, summaryTotals[column])
                  : '';
                
                return (
                  <TableCell key={`total-${column}`} className={`font-medium ${highlightColor}`}>
                    {numericColumns.includes(column) 
                      ? formatMetric(column, summaryTotals[column])
                      : column.toLowerCase().includes('client') ? 'Total' : ''}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
};

export default DataTable;
