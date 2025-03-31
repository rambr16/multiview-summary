
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
    
    return processedRow;
  });
  
  return processedData;
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
        const val = typeof row[col] === 'number' ? row[col] : Number(row[col]) || 0;
        return acc + (val as number);
      }, 0);
      summary[col] = sum;
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
        const val = typeof row[col] === 'number' ? row[col] : Number(row[col]) || 0;
        clientGroups[client][col] = (clientGroups[client][col] as number) + (val as number);
      });
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
