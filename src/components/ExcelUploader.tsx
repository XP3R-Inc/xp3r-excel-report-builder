import { useState } from 'react';
import { Upload } from 'lucide-react';
import { parseExcelFile, ParsedExcelData } from '../utils/excelParser';

interface ExcelUploaderProps {
  onDataParsed: (data: ParsedExcelData, fileName: string) => void;
}

export function ExcelUploader({ onDataParsed }: ExcelUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    console.log('File selected:', file.name, file.type, file.size);

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Please upload an Excel file (.xlsx, .xls, or .csv)');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('Starting to parse file...');
      const data = await parseExcelFile(file);
      console.log('File parsed successfully:', data);
      onDataParsed(data, file.name);
    } catch (err) {
      console.error('Error parsing file:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse Excel file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const loadSampleData = () => {
    const sampleData: ParsedExcelData = {
      headers: ['Name', 'Email', 'Company', 'Position', 'Skills', 'Certifications', 'Salary', 'StartDate', 'Bonus'],
      data: [
        {
          Name: 'John Doe',
          Email: 'john@example.com',
          Company: 'Acme Corp',
          Position: 'Manager',
          Skills: 'Leadership, Communication, Strategy',
          Certifications: 'PMP, MBA',
          Salary: 75000,
          StartDate: '2020-03-15',
          Bonus: 7500
        },
        {
          Name: 'Jane Smith',
          Email: 'jane@example.com',
          Company: 'Tech Inc',
          Position: 'Developer',
          Skills: 'React, Node.js, TypeScript, Python',
          Certifications: 'AWS Certified, Google Cloud',
          Salary: 85000,
          StartDate: '2019-07-01',
          Bonus: 10000
        },
        {
          Name: 'Bob Johnson',
          Email: 'bob@example.com',
          Company: 'StartUp Co',
          Position: 'Designer',
          Skills: 'UI/UX, Figma, Adobe XD, Sketch',
          Certifications: 'Adobe Certified',
          Salary: 70000,
          StartDate: '2021-01-20',
          Bonus: 5000
        },
        {
          Name: 'Alice Williams',
          Email: 'alice@example.com',
          Company: 'BigCorp',
          Position: 'Director',
          Skills: 'Strategy, Management, Finance, Operations',
          Certifications: 'MBA, CPA',
          Salary: 95000,
          StartDate: '2018-09-10',
          Bonus: 15000
        },
        {
          Name: 'Charlie Brown',
          Email: 'charlie@example.com',
          Company: 'Innovate LLC',
          Position: 'Data Analyst',
          Skills: 'SQL, Python, Tableau, Power BI',
          Certifications: 'Tableau Certified',
          Salary: 65000,
          StartDate: '2022-05-01',
          Bonus: 4000
        },
      ],
      rowCount: 5,
    };
    onDataParsed(sampleData, 'sample-data.xlsx');
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
      >
        <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2 text-gray-700">
          Upload Excel File
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Drag and drop your Excel file here, or click to browse
        </p>
        <div className="flex items-center justify-center gap-3">
          <label className="inline-block">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileInput}
              disabled={isProcessing}
              className="hidden"
            />
            <span className="px-6 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors inline-block">
              {isProcessing ? 'Processing...' : 'Select File'}
            </span>
          </label>
          <button
            onClick={loadSampleData}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Use Sample Data
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
