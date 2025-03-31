
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
          {data.map((row, i) => (
            <TableRow key={i}>
              {displayColumns.map((column) => {
                // Get highlight color for conditional formatting
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
        {hasNumericColumns && (
          <TableFooter>
            <TableRow>
              {displayColumns.map((column) => {
                // Get highlight color for conditional formatting in footer row
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
