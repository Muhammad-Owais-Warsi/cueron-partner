'use client';

/**
 * Bulk Upload Dialog Component
 *
 * Handles CSV file upload for bulk engineer creation.
 *
 * Requirements: 2.5
 */

import { useState, useRef, useCallback } from 'react';
import type { BulkEngineerUpload } from '@cueron/types';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, FileText, X, UploadIcon } from 'lucide-react';
import { Spinner } from '../ui/spinner';

interface BulkUploadDialogProps {
  agencyId?: string;
}

export function BulkUploadDialog({ agencyId }: BulkUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkEngineerUpload | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileValidation = useCallback((selectedFile: File) => {
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return false;
    }
    return true;
  }, []);

  const handleFileSelect = useCallback(
    (selectedFile: File) => {
      if (handleFileValidation(selectedFile)) {
        setFile(selectedFile);
        setResult(null);
      }
    },
    [handleFileValidation]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleUpload = async () => {
    if (!file) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('file', file);
      if (agencyId) {
        formData.append('agency_id', agencyId);
      }

      const response = await fetch('/api/engineers/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Upload failed');
      }

      setResult(data);

      if (data.error_count === 0) {
        toast.success(`Successfully uploaded ${data.success_count} engineers!`);
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        toast.warning(`Upload completed with ${data.error_count} errors. Check results below.`);

        if (data.errors && data.errors.length > 0) {
          const errorSummary = data.errors
            .slice(0, 3)
            .map((err: any) => `Row ${err.row}: ${err.message}`)
            .join('\n');
          toast.error(
            `Upload errors:\n${errorSummary}${data.errors.length > 3 ? '\n...and more' : ''}`
          );
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setIsDragOver(false);
  };

  const downloadTemplate = () => {
    const csvContent = `name,phone,email,skill_level,employment_type,specializations,certifications
John Doe,9876543210,john@example.com,3,full_time,"Web Development,API Development","ITI:Level 1:CERT001:true"
Jane Smith,9876543211,jane@example.com,4,part_time,"Mobile Development","PMKVY:Level 2:CERT002:false"`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'engineer_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Template downloaded successfully');
  };

  return (
    <Dialog>
      <DialogTrigger>
        <Button variant="outline">
          <UploadIcon />
          Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Upload Engineers</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instructions */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-2">Instructions</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Download the CSV template below</li>
                <li>Fill in engineer details following the format</li>
                <li>Upload the completed CSV file</li>
                <li>Review any errors and fix them before re-uploading</li>
              </ul>
            </CardContent>
          </Card>

          <Button onClick={downloadTemplate} variant="outline" className="h-12">
            <Download className="h-4 w-4 mr-2" />
            Download CSV Template
          </Button>

          <div className="space-y-2">
            <Label>Upload CSV File</Label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${
                  isDragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">
                {isDragOver ? 'Drop your CSV file here' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Only CSV files are supported</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {file && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">{file.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {(file.size / 1024).toFixed(2)} KB
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                  className="ml-auto h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {result?.error_count === 0 ? 'Done' : 'Cancel'}
          </Button>
          <Button onClick={handleUpload} disabled={!file || loading}>
            {loading ? <Spinner /> : ''}Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
