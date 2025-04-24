
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
import { formatColumnName, formatCellValue, formatMetric, getMetricHighlightColor } from "./summary/formatters";
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
  
  // Filter out unwanted columns and rows
  const columnsToHide = [
    'unsubscribed_count', 
    'client_email', 
    'open_count',
    'block_count'
  ];
  
  // Check if AM data is present in ANY row
  const hasAmData = data.some(row => 'AM' in row);
  
  // Add AM-related columns to hide if AM data is not present
  if (!hasAmData) {
    columnsToHide.push('AM', 'Target', 'Target %', 'Weekend sendout');
  }
  
  const filteredDisplayColumns = displayColumns.filter(
    column => !columnsToHide.includes(column) && 
             !columnsToHide.some(col => column.toLowerCase() === col.toLowerCase())
  );

  // Filter rows where Unique Sent Count > 1 and not summary rows
  const filteredData = data.filter(row => {
    const uniqueSentCount = Number(row['unique_sent_count']) || 0;
    const clientField = Object.keys(row).find(key => key.toLowerCase().includes('client'));
    const isNotSummary = clientField ? !String(row[clientField]).includes(' - Summary') : true;
    return uniqueSentCount > 1 && isNotSummary;
  });

  // Sort data alphabetically by client name
  const sortedData = [...filteredData].sort((a, b) => {
    const clientField = Object.keys(a).find(key => key.toLowerCase().includes('client'));
    if (!clientField) return 0;
    const clientA = String(a[clientField] || '').toLowerCase();
    const clientB = String(b[clientField] || '').toLowerCase();
    return clientA.localeCompare(clientB);
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
          {sortedData.map((row, i) => (
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
        {hasNumericColumns && sortedData.length > 0 && (
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
