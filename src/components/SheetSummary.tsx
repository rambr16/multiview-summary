
import React, { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

interface SheetSummaryProps {
  data: any[];
  viewType: "detailed" | "summary";
}

const SheetSummary: React.FC<SheetSummaryProps> = ({ 
  data, 
  viewType 
}) => {
  if (!data || data.length === 0) return (
    <div className="py-8 text-center text-gray-500">
      No data available. Please check your selected sheets and try again.
    </div>
  );
  
  // Columns to exclude from display
  const columnsToExclude = [
    "total_count", 
    "drafted_count", 
    "record_count", 
    "id", 
    "user_id",
    "ln_connection_req_pending_count",
    "ln_connection_req_accepted_count",
    "ln_connection_req_skipped_sent_msg_count",
    "unique_open_count",
    "click_count",
    "unique_click_count"
  ];

  // Columns to include in the summary cards section
  const summaryCardColumns = [
    "sent_count",
    "unique_sent_count",
    "open_count",
    "reply_count",
    "positive_reply_count",
    "bounce_count",
    "prr_vs_rr",
    "rr",
    "bounce_rate",
    "unique_leads_per_positive"
  ];
  
  // Get columns to display
  const displayColumns = Object.keys(data[0]).filter(col => 
    !columnsToExclude.includes(col.toLowerCase())
  );

  // Calculate summary totals for numeric columns
  const summaryTotals = useMemo(() => {
    const totals: Record<string, number | string> = {};
    
    if (data.length === 0) return totals;
    
    displayColumns.forEach(col => {
      // Check if this column contains numeric values
      const isNumeric = data.some(row => 
        typeof row[col] === 'number' || 
        (typeof row[col] === 'string' && !isNaN(Number(row[col])))
      );
      
      if (isNumeric) {
        totals[col] = data.reduce((sum, row) => {
          const value = typeof row[col] === 'number' ? row[col] : Number(row[col]) || 0;
          return sum + value;
        }, 0);
      } else if (col === 'unique_leads_per_positive') {
        // Special handling for unique_leads_per_positive
        const totalUniqueSent = data.reduce((acc, row) => 
          acc + (Number(row['unique_sent_count']) || 0), 0);
        const totalPositiveReply = data.reduce((acc, row) => 
          acc + (Number(row['positive_reply_count']) || 0), 0);
        totals[col] = totalPositiveReply > 0 ? totalUniqueSent / totalPositiveReply : 'no positive reply';
      }
    });
    
    return totals;
  }, [data, displayColumns]);

  // Format percentages and special values
  const formatMetric = (key: string, value: any): string => {
    if (value === 'no positive reply') return 'No positive reply';
    
    if (['prr_vs_rr', 'rr', 'bounce_rate'].includes(key)) {
      return typeof value === 'number' ? `${value.toFixed(2)}%` : String(value);
    }
    
    if (key === 'unique_leads_per_positive' && typeof value === 'number') {
      return value.toFixed(2);
    }
    
    return formatCellValue(value);
  };
  
  // Get metric descriptions for the summary cards
  const getMetricDescription = (key: string): string => {
    switch(key) {
      case 'prr_vs_rr': return 'Positive Reply Count / Reply Count';
      case 'rr': return 'Reply Count / Unique Sent Count';
      case 'bounce_rate': return 'Bounce Count / Unique Sent Count';
      case 'unique_leads_per_positive': return 'Unique Sent Count / Positive Reply Count';
      default: return '';
    }
  };
  
  // Determine which columns are numeric for summary display
  const numericColumns = Object.keys(summaryTotals);
  const hasNumericColumns = numericColumns.length > 0;

  // Ensure we have valid data to display
  if (!displayColumns.length) {
    return (
      <div className="py-8 text-center text-gray-500">
        No columns to display. The data may be invalid.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {hasNumericColumns && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-2">Summary of Filtered Data</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summaryCardColumns.map(col => {
                if (!summaryTotals.hasOwnProperty(col)) return null;
                
                return (
                  <div key={`summary-${col}`} className="bg-muted/50 p-3 rounded-md">
                    <dt className="text-sm font-medium text-muted-foreground">
                      {formatColumnName(col)}
                      {getMetricDescription(col) && (
                        <span className="block text-xs text-muted-foreground mt-1">
                          {getMetricDescription(col)}
                        </span>
                      )}
                    </dt>
                    <dd className="text-lg font-semibold mt-1">
                      {formatMetric(col, summaryTotals[col])}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </CardContent>
        </Card>
      )}

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
                {displayColumns.map((column) => (
                  <TableCell key={`${i}-${column}`} className="whitespace-nowrap">
                    {['prr_vs_rr', 'rr', 'bounce_rate'].includes(column) 
                      ? formatMetric(column, row[column])
                      : formatCellValue(row[column])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
          {hasNumericColumns && (
            <TableFooter>
              <TableRow>
                {displayColumns.map((column) => (
                  <TableCell key={`total-${column}`} className="font-medium">
                    {numericColumns.includes(column) 
                      ? formatMetric(column, summaryTotals[column])
                      : column.toLowerCase().includes('client') ? 'Total' : ''}
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
};

// Helper function to format column names
const formatColumnName = (column: string): string => {
  const specialNames: Record<string, string> = {
    'prr_vs_rr': 'PRR vs RR',
    'rr': 'RR',
    'bounce_rate': 'Bounce',
    'unique_leads_per_positive': 'Unique Leads/Positive'
  };

  if (specialNames[column]) return specialNames[column];
  return column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Helper function to format cell values
const formatCellValue = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (value === 'no positive reply') return 'No positive reply';
  if (typeof value === 'number') return Number(value).toLocaleString();
  return String(value);
};

export default SheetSummary;
