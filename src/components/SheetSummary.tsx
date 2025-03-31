
import React, { useMemo } from "react";
import SummaryCards from "./summary/SummaryCards";
import DataTable from "./summary/DataTable";
import { DataRow } from "@/utils/fileTypes";

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

  // Calculate summary totals and aggregated metrics
  const summaryTotals = useMemo(() => {
    const totals: Record<string, number | string> = {};
    
    if (data.length === 0) return totals;
    
    // First calculate base sum totals for numeric columns
    displayColumns.forEach(col => {
      // Skip the calculated percentage fields - we'll compute these from raw values
      if (["prr_vs_rr", "rr", "bounce_rate", "unique_leads_per_positive"].includes(col)) {
        return;
      }
      
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
      }
    });
    
    // Now calculate the aggregated metrics based on sum totals
    
    // PRR vs RR - Positive Reply Count / Reply Count (percentage)
    const totalPositiveReply = Number(totals['positive_reply_count']) || 0;
    const totalReply = Number(totals['reply_count']) || 0;
    totals['prr_vs_rr'] = totalReply > 0 ? (totalPositiveReply / totalReply) * 100 : 0;
    
    // RR - Reply Count / Unique Sent Count (percentage)
    const totalUniqueSent = Number(totals['unique_sent_count']) || 0;
    totals['rr'] = totalUniqueSent > 0 ? (totalReply / totalUniqueSent) * 100 : 0;
    
    // Bounce - Bounce Count / Unique Sent Count (percentage)
    const totalBounce = Number(totals['bounce_count']) || 0;
    totals['bounce_rate'] = totalUniqueSent > 0 ? (totalBounce / totalUniqueSent) * 100 : 0;
    
    // Unique leads per positive - Unique Sent Count / Positive Reply Count
    totals['unique_leads_per_positive'] = totalPositiveReply > 0 
      ? totalUniqueSent / totalPositiveReply 
      : 'no positive reply';
    
    return totals;
  }, [data, displayColumns]);

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
        <SummaryCards 
          summaryTotals={summaryTotals} 
          summaryCardColumns={summaryCardColumns} 
        />
      )}

      <DataTable 
        data={data}
        displayColumns={displayColumns}
        numericColumns={numericColumns}
        summaryTotals={summaryTotals}
      />
    </div>
  );
};

export default SheetSummary;
