/**
 * Report Export Interface Component
 * Provides interface for exporting reports in CSV and PDF formats
 * Requirements: 16.1, 16.4
 */

'use client';

import React, { useState } from 'react';

interface ReportExportInterfaceProps {
  agencyId?: string;
}

type ReportFormat = 'csv' | 'pdf';
type ReportType = 'monthly' | 'quarterly' | 'annual' | 'custom';

export function ReportExportInterface({ agencyId }: ReportExportInterfaceProps) {
  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [format, setFormat] = useState<ReportFormat>('pdf');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleExport = async () => {
    if (!agencyId) {
      setExportStatus({
        type: 'error',
        message: 'Agency ID is required',
      });
      return;
    }

    if (reportType === 'custom' && (!startDate || !endDate)) {
      setExportStatus({
        type: 'error',
        message: 'Please select both start and end dates for custom reports',
      });
      return;
    }

    setIsExporting(true);
    setExportStatus({ type: null, message: '' });

    try {
      // Build query parameters
      const params = new URLSearchParams({
        format,
        report_type: reportType,
      });

      if (reportType === 'custom') {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }

      // Note: This endpoint would need to be implemented
      // For now, we'll simulate the export
      const response = await fetch(
        `/api/agencies/${agencyId}/reports/export?${params.toString()}`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportType}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportStatus({
        type: 'success',
        message: `Report exported successfully as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus({
        type: 'error',
        message: 'Failed to export report. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Export Reports</h2>
        <p className="text-sm text-gray-500 mt-1">
          Generate and download reports in CSV or PDF format
        </p>
      </div>

      <div className="space-y-6">
        {/* Report Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Report Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: 'monthly', label: 'Monthly Report', icon: '📅' },
              { value: 'quarterly', label: 'Quarterly Report', icon: '📊' },
              { value: 'annual', label: 'Annual Report', icon: '📈' },
              { value: 'custom', label: 'Custom Range', icon: '🔧' },
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => setReportType(type.value as ReportType)}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  reportType === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">{type.icon}</div>
                <div className="text-sm font-medium text-gray-900">{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range */}
        {reportType === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormat('csv')}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                format === 'csv'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm font-medium text-gray-900">CSV</div>
              <div className="text-xs text-gray-500 mt-1">
                Spreadsheet format for data analysis
              </div>
            </button>
            <button
              onClick={() => setFormat('pdf')}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                format === 'pdf'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">📄</div>
              <div className="text-sm font-medium text-gray-900">PDF</div>
              <div className="text-xs text-gray-500 mt-1">
                Formatted document with agency branding
              </div>
            </button>
          </div>
        </div>

        {/* Report Contents Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Report Contents</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Jobs completed and revenue summary</li>
            <li>• Engineer utilization and performance metrics</li>
            <li>• Average ratings and customer feedback</li>
            <li>• Job type distribution and trends</li>
            <li>• Month-over-month growth analysis</li>
          </ul>
        </div>

        {/* Status Message */}
        {exportStatus.type && (
          <div
            className={`p-4 rounded-lg ${
              exportStatus.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <p
              className={`text-sm ${
                exportStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {exportStatus.message}
            </p>
          </div>
        )}

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isExporting || !agencyId}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
            isExporting || !agencyId
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isExporting ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generating Report...
            </span>
          ) : (
            `Export ${format.toUpperCase()} Report`
          )}
        </button>
      </div>
    </div>
  );
}
