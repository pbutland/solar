import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { getEnergyCsvParser } from '../parsers/csvProcessor';
import type { EnergyData } from '../types/index';
import './FileUpload.css';

interface FileUploadProps {
  onDataLoaded: (data: EnergyData) => void;
  onError: (error: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, onError }) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        if (file.type !== 'text/csv') {
          onError('Please upload a valid CSV file.');
          return;
        }

        // First, parse with header: false to peek at the first row
        Papa.parse(file, {
          header: false,
          skipEmptyLines: true,
          complete: (previewResults) => {
            const firstRow = previewResults.data[0];
            if (
              Array.isArray(firstRow) &&
              ['100', '200', '300'].includes(firstRow[0])
            ) {
              // NEM12: use array-of-arrays
              try {
                const processedData = getEnergyCsvParser(previewResults.data as string[][]).parse(previewResults.data as string[][]);
                onDataLoaded(processedData);
              } catch (error) {
                onError(error instanceof Error ? `Error processing file: ${error.message}` : 'An unknown error occurred during file processing.');
              }
            } else {
              // Not NEM12: re-parse with header: true
              Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                  try {
                    const processedData = getEnergyCsvParser(results.data as any[]).parse(results.data as any[]);
                    onDataLoaded(processedData);
                  } catch (error) {
                    onError(error instanceof Error ? `Error processing file: ${error.message}` : 'An unknown error occurred during file processing.');
                  }
                },
                error: (error: Error) => {
                  onError(`Error parsing CSV: ${error.message}`);
                },
              });
            }
          },
          error: (error: Error) => {
            onError(`Error parsing CSV: ${error.message}`);
          },
        });
      }
    },
    [onDataLoaded, onError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <div className="file-upload-section">
      <div className="upload-header">
        <h3>Upload Your Energy Data</h3>
        <p>Upload your electricity usage CSV file to see personalized solar analysis</p>
      </div>
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag 'n' drop your energy usage CSV file here, or click to select files</p>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
