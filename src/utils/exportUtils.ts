
import * as XLSX from 'xlsx';
import { DataRow } from './fileTypes';
import { generateSummaryView } from './summaryGenerator';

// Helper function to create client summaries
const createClientSummary = (data: DataRow[], clientField: string | null, clientName: string): DataRow => {
  const summary: DataRow = {};
  
  // Find the client field if not provided
  if (!clientField) {
    clientField = Object.keys(data[0] || {}).find(key => 
      key.toLowerCase().includes('client')
    ) || '';
  }
  
  // Set the client name with summary suffix
  if (clientField) {
    summary[clientField] = `${clientName} - Summary`;
  }
  
  // Get all numeric columns except calculated fields
  const columns = Object.keys(data[0] || {});
  const numericColumns = columns.filter(col => 
    !['total_count', 'drafted_count', 'record_count', 'id', 'user_id'].includes(col.toLowerCase()) &&
    !['prr_vs_rr', 'rr', 'bounce_rate', 'unique_leads_per_positive'].includes(col) &&
    (typeof data[0][col] === 'number' || !isNaN(Number(data[0][col])))
  );
  
  // Sum numeric values for this client
  numericColumns.forEach(col => {
    const sum = data.reduce((acc, row) => {
      const val = typeof row[col] === 'number' ? row[col] : Number(row[col]) || 0;
      return acc + (val as number);
    }, 0);
    
    summary[col] = sum;
  });
  
  // Add calculated metrics
  if (summary['unique_sent_count'] && (summary['unique_sent_count'] as number) > 0) {
    const uniqueSentCount = summary['unique_sent_count'] as number;
    const replyCount = summary['reply_count'] as number || 0;
    const positiveReplyCount = summary['positive_reply_count'] as number || 0;
    const bounceCount = summary['bounce_count'] as number || 0;
    
    // PRR vs RR - Positive Reply Count / Reply Count (percentage)
    if (replyCount > 0) {
      summary['prr_vs_rr'] = (positiveReplyCount / replyCount) * 100;
    } else {
      summary['prr_vs_rr'] = 0;
    }
    
    // RR - Reply Count / Unique Sent Count (percentage)
    summary['rr'] = (replyCount / uniqueSentCount) * 100;
    
    // Bounce Rate - Bounce Count / Unique Sent Count (percentage)
    summary['bounce_rate'] = (bounceCount / uniqueSentCount) * 100;
    
    // Unique Leads per Positive
    if (positiveReplyCount > 0) {
      summary['unique_leads_per_positive'] = uniqueSentCount / positiveReplyCount;
    } else {
      summary['unique_leads_per_positive'] = 'no positive reply';
    }
  }
  
  return summary;
};

export const downloadCsv = (data: DataRow[], selectedClient: string | null = null, allData: DataRow[] = []): void => {
  if (data.length === 0) return;
  
  // Find the client field
  const clientField = Object.keys(data[0] || {}).find(key => 
    key.toLowerCase().includes('client')
  );

  let dataToExport = [...data];
  
  // Filter rows where Unique Sent Count > 1 and exclude summary rows
  dataToExport = dataToExport.filter(row => {
    const uniqueSentCount = Number(row['unique_sent_count']) || 0;
    const isNotSummary = clientField ? 
      !String(row[clientField] || '').includes(' - Summary') : 
      true;
    return uniqueSentCount > 1 && isNotSummary;
  });

  // Sort alphabetically by client name
  if (clientField) {
    dataToExport.sort((a, b) => {
      const clientA = String(a[clientField] || '').toLowerCase();
      const clientB = String(b[clientField] || '').toLowerCase();
      return clientA.localeCompare(clientB);
    });
  }

  // Check if AM data is present by looking for AM column across all data rows
  // We check ALL data since AM column might exist in the executive summary but not in filtered data
  const hasAmData = dataToExport.some(row => 'AM' in row) || allData.some(row => 'AM' in row);

  // Generate executive summary if AM data is available
  let executiveRows: DataRow[] = [];
  if (hasAmData && !selectedClient) {
    // Generate executive summary data similar to how it's done in ExecutiveSummary component
    const allClientField = Object.keys(allData[0] || {}).find(key => key.toLowerCase().includes('client'));
    
    if (allClientField) {
      // Group by client
      const clientGroups: { [key: string]: DataRow } = {};
      
      // Only process rows that aren't summaries and have uniqueSent > 1
      const validRows = allData.filter(row => {
        const client = String(row[allClientField] || '');
        const uniqueSentCount = Number(row['unique_sent_count']) || 0;
        return uniqueSentCount > 1 && !client.includes('- Summary');
      });
      
      validRows.forEach(row => {
        const client = String(row[allClientField] || 'Unknown');
        
        if (!clientGroups[client]) {
          clientGroups[client] = { 
            [allClientField]: client
          };
          
          // Initialize numeric fields
          ['sent_count', 'unique_sent_count', 'positive_reply_count', 'reply_count', 'bounce_count'].forEach(col => {
            clientGroups[client][col] = 0;
          });
          
          // Copy AM data if present (for any row with this client)
          const amRow = allData.find(r => r[allClientField] === client && 'AM' in r);
          if (amRow) {
            ['AM', 'Target', 'Weekend sendout'].forEach(key => {
              if (key in amRow) clientGroups[client][key] = amRow[key];
            });
          }
        }
        
        // Sum numeric columns
        ['sent_count', 'unique_sent_count', 'positive_reply_count', 'reply_count', 'bounce_count'].forEach(col => {
          if (col in row) {
            const val = typeof row[col] === 'number' ? row[col] : Number(row[col]) || 0;
            clientGroups[client][col] = (clientGroups[client][col] as number) + (val as number);
          }
        });
      });
      
      // Calculate derived metrics and set Target %
      Object.values(clientGroups).forEach(group => {
        const uniqueSent = Number(group['unique_sent_count'] || 0);
        const positive = Number(group['positive_reply_count'] || 0);
        const reply = Number(group['reply_count'] || 0);
        const bounce = Number(group['bounce_count'] || 0);
        const target = Number(group['Target'] || 0);
        
        // Calculate Target %
        if (target > 0) {
          group['Target %'] = `${((uniqueSent / target) * 100).toFixed(2)}%`;
        }
        
        // PRR vs RR
        if (reply > 0) {
          group['prr_vs_rr'] = (positive / reply) * 100;
        } else {
          group['prr_vs_rr'] = 0;
        }
        
        // RR
        if (uniqueSent > 0) {
          group['rr'] = (reply / uniqueSent) * 100;
        } else {
          group['rr'] = 0;
        }
        
        // Bounce Rate
        if (uniqueSent > 0) {
          group['bounce_rate'] = (bounce / uniqueSent) * 100;
        } else {
          group['bounce_rate'] = 0;
        }
        
        // Unique sent per positive
        if (positive > 0) {
          group['unique_sent_per_positives'] = uniqueSent / positive;
        } else {
          group['unique_sent_per_positives'] = 'no positive';
        }
      });
      
      executiveRows = Object.values(clientGroups);
      
      // Sort the executive summary rows
      executiveRows.sort((a, b) => {
        const clientA = String(a[allClientField] || '').toLowerCase();
        const clientB = String(b[allClientField] || '').toLowerCase();
        return clientA.localeCompare(clientB);
      });
    }
  }
  
  // Combine executive summary rows with filtered data if available
  const finalData = executiveRows.length > 0 ? [...executiveRows, ...dataToExport] : dataToExport;

  // Don't remove AM columns if they exist in the data
  if (!hasAmData) {
    dataToExport = finalData.map(row => {
      const newRow = { ...row };
      ['AM', 'Target', 'Target %', 'Weekend sendout'].forEach(key => {
        delete newRow[key];
      });
      return newRow;
    });
  } else {
    dataToExport = finalData;
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(dataToExport);
  
  XLSX.utils.book_append_sheet(wb, ws, "Summary");
  XLSX.writeFile(wb, "workbook_summary.csv");
};
