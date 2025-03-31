
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatColumnName, formatMetric, getMetricHighlightColor, getCardHighlightColor } from "./formatters";

interface SummaryCardsProps {
  summaryTotals: Record<string, number | string>;
  summaryCardColumns: string[];
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ 
  summaryTotals, 
  summaryCardColumns 
}) => {
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

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium mb-2">Summary of Filtered Data</h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summaryCardColumns.map(col => {
            if (!summaryTotals.hasOwnProperty(col)) return null;
            
            // Get the appropriate background color for conditional highlighting
            const bgHighlightColor = getCardHighlightColor(col, summaryTotals[col]);
            const textHighlightColor = getMetricHighlightColor(col, summaryTotals[col]);
            
            return (
              <div 
                key={`summary-${col}`} 
                className={`p-3 rounded-md ${bgHighlightColor || 'bg-muted/50'}`}
              >
                <dt className="text-sm font-medium text-muted-foreground">
                  {formatColumnName(col)}
                  {getMetricDescription(col) && (
                    <span className="block text-xs text-muted-foreground mt-1">
                      {getMetricDescription(col)}
                    </span>
                  )}
                </dt>
                <dd className={`text-lg font-semibold mt-1 ${textHighlightColor}`}>
                  {formatMetric(col, summaryTotals[col])}
                </dd>
              </div>
            );
          })}
        </dl>
      </CardContent>
    </Card>
  );
};

export default SummaryCards;
