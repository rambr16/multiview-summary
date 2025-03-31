
import * as XLSX from 'xlsx';

export interface DataRow {
  [key: string]: string | number;
}

export const processWorkbook = async (file: File): Promise<XLSX.WorkBook> => {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    return workbook;
  } catch (error) {
    console.error('Error processing file:', error);
    throw new Error('Failed to process the file. Please check the file format.');
  }
};

export const extractSheetData = (workbook: XLSX.WorkBook, selectedSheets: string[]): DataRow[] => {
  const allData: DataRow[] = [];
  
  for (const sheetName of selectedSheets) {
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      console.warn(`Sheet "${sheetName}" not found in workbook`);
      continue;
    }
    
    const sheetData = XLSX.utils.sheet_to_json<DataRow>(worksheet, { defval: '' });
    
    const validRows = sheetData.filter(row => {
      return Object.values(row).some(val => val !== '');
    });
    
    if (validRows.length > 0) {
      console.log(`Processed ${validRows.length} rows from sheet "${sheetName}"`);
      allData.push(...validRows);
    } else {
      console.warn(`No valid data found in sheet "${sheetName}"`);
    }
  }
  
  console.log(`Total rows processed from all sheets: ${allData.length}`);
  
  const processedData = allData.map(row => {
    const processedRow: DataRow = {};
    
    const numericFields = [
      'sent_count', 'unique_sent_count', 'positive_reply_count', 
      'reply_count', 'bounce_count', 'open_count', 'unique_open_count',
      'click_count'
    ];
    
    Object.keys(row).forEach(key => {
      // Skip columns we want to exclude
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'record_count' || 
          lowerKey === 'id' || 
          lowerKey === 'user_id' || 
          lowerKey === 'ln_connection_req_pending_count' ||
          lowerKey === 'ln_connection_req_accepted_count' ||
          lowerKey === 'ln_connection_req_skipped_sent_msg_count') {
        return;
      }
      
      if (numericFields.includes(lowerKey) && typeof row[key] === 'string') {
        const numValue = parseFloat(row[key] as string);
        processedRow[key] = isNaN(numValue) ? 0 : numValue;
      } else {
        processedRow[key] = row[key];
      }
    });
    
    // Add the calculated fields
    const uniqueSentCount = processedRow['unique_sent_count'] as number || 0;
    const positiveReplyCount = processedRow['positive_reply_count'] as number || 0;
    const replyCount = processedRow['reply_count'] as number || 0;
    const bounceCount = processedRow['bounce_count'] as number || 0;
    
    // PRR vs RR - Positive Reply Count / Reply Count (percentage)
    if (replyCount > 0) {
      processedRow['prr_vs_rr'] = (positiveReplyCount / replyCount) * 100;
    } else {
      processedRow['prr_vs_rr'] = 0;
    }
    
    // RR - Reply Count / Unique Sent Count (percentage)
    if (uniqueSentCount > 0) {
      processedRow['rr'] = (replyCount / uniqueSentCount) * 100;
    } else {
      processedRow['rr'] = 0;
    }
    
    // Bounce - Bounce Count / Unique Sent Count (percentage)
    if (uniqueSentCount > 0) {
      processedRow['bounce_rate'] = (bounceCount / uniqueSentCount) * 100;
    } else {
      processedRow['bounce_rate'] = 0;
    }
    
    // Unique leads / Positive - Unique Sent Count / Positive Reply Count
    if (positiveReplyCount > 0) {
      processedRow['unique_leads_per_positive'] = uniqueSentCount / positiveReplyCount;
    } else {
      processedRow['unique_leads_per_positive'] = 'no positive reply';
    }
    
    return processedRow;
  });
  
  // Filter to only include rows where unique_sent_count >= 1
  return processedData.filter(row => {
    const uniqueSentCount = row['unique_sent_count'] as number;
    return typeof uniqueSentCount === 'number' && uniqueSentCount >= 1;
  });
};

export const generateSummaryView = (filteredData: DataRow[]): DataRow[] => {
  if (!filteredData.length) return [];

  const columns = Object.keys(filteredData[0]);
  const numericColumns = columns.filter(col => 
    !['total_count', 'drafted_count', 'record_count', 'id', 'user_id'].includes(col.toLowerCase()) &&
    (typeof filteredData[0][col] === 'number' || 
     !isNaN(Number(filteredData[0][col])))
  );

  const clientField = columns.find(col => col.toLowerCase().includes('client')) || null;
  
  if (!clientField) {
    const summary: DataRow = {};
    numericColumns.forEach(col => {
      const sum = filteredData.reduce((acc, row) => {
        // Skip unique_leads_per_positive when it's "no positive reply"
        if (col === 'unique_leads_per_positive' && row[col] === 'no positive reply') {
          return acc;
        }
        
        const val = typeof row[col] === 'number' ? row[col] : Number(row[col]) || 0;
        return acc + (val as number);
      }, 0);
      
      // For calculated percentage fields, we need to recalculate rather than sum
      if (col === 'prr_vs_rr') {
        const totalPositiveReply = filteredData.reduce((acc, row) => 
          acc + (Number(row['positive_reply_count']) || 0), 0);
        const totalReply = filteredData.reduce((acc, row) => 
          acc + (Number(row['reply_count']) || 0), 0);
        summary[col] = totalReply > 0 ? (totalPositiveReply / totalReply) * 100 : 0;
      } else if (col === 'rr') {
        const totalReply = filteredData.reduce((acc, row) => 
          acc + (Number(row['reply_count']) || 0), 0);
        const totalUniqueSent = filteredData.reduce((acc, row) => 
          acc + (Number(row['unique_sent_count']) || 0), 0);
        summary[col] = totalUniqueSent > 0 ? (totalReply / totalUniqueSent) * 100 : 0;
      } else if (col === 'bounce_rate') {
        const totalBounce = filteredData.reduce((acc, row) => 
          acc + (Number(row['bounce_count']) || 0), 0);
        const totalUniqueSent = filteredData.reduce((acc, row) => 
          acc + (Number(row['unique_sent_count']) || 0), 0);
        summary[col] = totalUniqueSent > 0 ? (totalBounce / totalUniqueSent) * 100 : 0;
      } else if (col === 'unique_leads_per_positive') {
        const totalUniqueSent = filteredData.reduce((acc, row) => 
          acc + (Number(row['unique_sent_count']) || 0), 0);
        const totalPositiveReply = filteredData.reduce((acc, row) => 
          acc + (Number(row['positive_reply_count']) || 0), 0);
        summary[col] = totalPositiveReply > 0 ? totalUniqueSent / totalPositiveReply : 'no positive reply';
      } else {
        summary[col] = sum;
      }
    });
    return [summary];
  } else {
    // Group by client
    const clientGroups: { [key: string]: DataRow } = {};
    
    filteredData.forEach(row => {
      const client = String(row[clientField] || 'Unknown');
      if (!clientGroups[client]) {
        clientGroups[client] = { 
          [clientField]: client
        };
        
        numericColumns.forEach(col => {
          if (!col.toLowerCase().includes('client')) {
            clientGroups[client][col] = 0;
          }
        });
      }
      
      // Sum numeric columns
      numericColumns.forEach(col => {
        if (col.toLowerCase().includes('client')) return;
        
        // Skip special fields that need to be calculated
        if (['prr_vs_rr', 'rr', 'bounce_rate', 'unique_leads_per_positive'].includes(col)) {
          return;
        }
        
        const val = typeof row[col] === 'number' ? row[col] : Number(row[col]) || 0;
        clientGroups[client][col] = (clientGroups[client][col] as number) + (val as number);
      });
    });
    
    // Calculate the derived fields for each client group
    Object.keys(clientGroups).forEach(client => {
      const group = clientGroups[client];
      
      // PRR vs RR
      const positiveReply = Number(group['positive_reply_count']) || 0;
      const reply = Number(group['reply_count']) || 0;
      group['prr_vs_rr'] = reply > 0 ? (positiveReply / reply) * 100 : 0;
      
      // RR
      const uniqueSent = Number(group['unique_sent_count']) || 0;
      group['rr'] = uniqueSent > 0 ? (reply / uniqueSent) * 100 : 0;
      
      // Bounce rate
      const bounce = Number(group['bounce_count']) || 0;
      group['bounce_rate'] = uniqueSent > 0 ? (bounce / uniqueSent) * 100 : 0;
      
      // Unique leads per positive
      group['unique_leads_per_positive'] = positiveReply > 0 ? uniqueSent / positiveReply : 'no positive reply';
    });
    
    return Object.values(clientGroups);
  }
};

export const downloadCsv = (data: DataRow[]): void => {
  if (data.length === 0) return;
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  XLSX.utils.book_append_sheet(wb, ws, "Summary");
  
  XLSX.writeFile(wb, "workbook_summary.csv");
};
