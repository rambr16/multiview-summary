
import * as XLSX from 'xlsx';
import { DataRow } from './fileTypes';

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
