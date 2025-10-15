import * as XLSX from 'xlsx';

export interface ParsedExcelData {
  headers: string[];
  data: Record<string, unknown>[];
  rowCount: number;
}

export function parseExcelFile(file: File): Promise<ParsedExcelData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        console.log('FileReader onload triggered');
        const binaryData = e.target?.result;

        if (!binaryData) {
          reject(new Error('No data read from file'));
          return;
        }

        console.log('Reading workbook...');
        const workbook = XLSX.read(binaryData, { type: 'binary' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          reject(new Error('No sheets found in workbook'));
          return;
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        console.log('Converting sheet to JSON...');
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          blankrows: false
        }) as unknown[][];

        if (jsonData.length === 0) {
          reject(new Error('Excel file is empty'));
          return;
        }

        const headers = (jsonData[0] as string[]).map((h, i) =>
          h && h.toString().trim() ? h.toString().trim() : `Column_${i + 1}`
        );

        const rows = jsonData.slice(1).filter(row =>
          row.some(cell => cell !== null && cell !== undefined && cell !== '')
        );

        const parsedData = rows.map(row => {
          const rowData: Record<string, unknown> = {};
          headers.forEach((header, index) => {
            rowData[header] = row[index] !== undefined ? row[index] : '';
          });
          return rowData;
        });

        console.log('Parsed data:', { headers, rowCount: parsedData.length });

        resolve({
          headers,
          data: parsedData,
          rowCount: parsedData.length
        });
      } catch (error) {
        console.error('Error in FileReader onload:', error);
        reject(error);
      }
    };

    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      reject(new Error('Failed to read file'));
    };

    console.log('Starting FileReader.readAsBinaryString...');
    reader.readAsBinaryString(file);
  });
}
