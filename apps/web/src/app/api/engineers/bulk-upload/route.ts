/**
 * Bulk Engineer Upload API Route
 * POST /api/engineers/bulk-upload
 * 
 * Handles bulk engineer creation from CSV file with validation,
 * phone uniqueness check, and error reporting.
 * 
 * Requirements: 2.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { CreateEngineerInputSchema } from '@cueron/utils/src/schemas';
import { createAdminClient } from '@/lib/supabase/server';
import type { BulkEngineerUpload } from '@cueron/types/src/engineer';

/**
 * Error response helper
 */
function errorResponse(
  code: string,
  message: string,
  details?: Record<string, string[]>,
  status: number = 400
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID(),
      },
    },
    { status }
  );
}

/**
 * Success response helper
 */
function successResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Parse CSV content into rows
 */
function parseCSV(content: string): string[][] {
  const lines = content.split('\n').filter(line => line.trim());
  return lines.map(line => {
    // Simple CSV parsing - handles quoted fields
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    fields.push(currentField.trim());
    return fields;
  });
}

/**
 * Parse certifications from CSV format
 * Expected format: "type:level:cert_number:verified|type:level:cert_number:verified"
 */
function parseCertifications(certString: string): any[] {
  if (!certString || certString.trim() === '') {
    return [];
  }
  
  const certs = certString.split('|').filter(c => c.trim());
  return certs.map(cert => {
    const [type, level, cert_number, verified] = cert.split(':');
    return {
      type: type?.trim() || 'Other',
      level: parseInt(level?.trim() || '1', 10),
      cert_number: cert_number?.trim() || '',
      verified: verified?.trim().toLowerCase() === 'true',
    };
  });
}

/**
 * Parse specializations from CSV format
 * Expected format: "spec1|spec2|spec3"
 */
function parseSpecializations(specString: string): string[] {
  if (!specString || specString.trim() === '') {
    return [];
  }
  return specString.split('|').map(s => s.trim()).filter(s => s);
}

/**
 * POST /api/engineers/bulk-upload
 * Upload CSV file with engineer data
 */
export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const agencyId = formData.get('agency_id') as string;

    if (!file) {
      return errorResponse(
        'MISSING_FILE',
        'No file provided',
        { file: ['CSV file is required'] },
        400
      );
    }

    if (!agencyId) {
      return errorResponse(
        'MISSING_AGENCY_ID',
        'Agency ID is required',
        { agency_id: ['Agency ID is required'] },
        400
      );
    }

    // Validate file type
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      return errorResponse(
        'INVALID_FILE_TYPE',
        'Invalid file type',
        { file: ['Only CSV files are accepted'] },
        400
      );
    }

    // Read file content
    const content = await file.text();
    const rows = parseCSV(content);

    if (rows.length === 0) {
      return errorResponse(
        'EMPTY_FILE',
        'CSV file is empty',
        { file: ['CSV file must contain data'] },
        400
      );
    }

    // Extract header and data rows
    const headers = rows[0].map(h => h.toLowerCase().trim());
    const dataRows = rows.slice(1);

    // Validate required headers
    const requiredHeaders = ['name', 'phone', 'skill_level', 'employment_type'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      return errorResponse(
        'MISSING_HEADERS',
        'CSV file is missing required headers',
        { headers: [`Missing headers: ${missingHeaders.join(', ')}`] },
        400
      );
    }

    // Create Supabase admin client
    const supabase = createAdminClient();

    // Track results
    const errors: Array<{ row: number; field: string; message: string }> = [];
    let successCount = 0;
    const createdEngineers: any[] = [];

    // Get existing phone numbers to check for duplicates
    const { data: existingEngineers } = await supabase
      .from('engineers')
      .select('phone');
    
    const existingPhones = new Set(
      existingEngineers?.map(e => e.phone) || []
    );

    // Process each row
    for (let i = 0; i < dataRows.length; i++) {
      const rowNumber = i + 2; // +2 because row 1 is header, and arrays are 0-indexed
      const row = dataRows[i];

      try {
        // Map CSV columns to engineer data
        const engineerData: any = {
          agency_id: agencyId,
        };

        headers.forEach((header, index) => {
          const value = row[index]?.trim();
          
          switch (header) {
            case 'name':
              engineerData.name = value;
              break;
            case 'phone':
              engineerData.phone = value;
              break;
            case 'email':
              engineerData.email = value || undefined;
              break;
            case 'photo_url':
              engineerData.photo_url = value || undefined;
              break;
            case 'skill_level':
              engineerData.skill_level = parseInt(value, 10);
              break;
            case 'employment_type':
              engineerData.employment_type = value;
              break;
            case 'certifications':
              engineerData.certifications = parseCertifications(value);
              break;
            case 'specializations':
              engineerData.specializations = parseSpecializations(value);
              break;
          }
        });

        // Set defaults for optional fields
        if (!engineerData.certifications) {
          engineerData.certifications = [];
        }
        if (!engineerData.specializations) {
          engineerData.specializations = [];
        }

        // Validate engineer data
        const validation = CreateEngineerInputSchema.safeParse(engineerData);
        
        if (!validation.success) {
          validation.error.errors.forEach((err: any) => {
            errors.push({
              row: rowNumber,
              field: err.path.join('.'),
              message: err.message,
            });
          });
          continue;
        }

        const validatedData = validation.data;

        // Check phone uniqueness
        if (existingPhones.has(validatedData.phone)) {
          errors.push({
            row: rowNumber,
            field: 'phone',
            message: `Phone number ${validatedData.phone} already exists`,
          });
          continue;
        }

        // Create engineer record
        const { data: newEngineer, error: insertError } = await supabase
          .from('engineers')
          .insert({
            agency_id: validatedData.agency_id,
            name: validatedData.name,
            phone: validatedData.phone,
            email: validatedData.email,
            photo_url: validatedData.photo_url,
            certifications: validatedData.certifications,
            skill_level: validatedData.skill_level,
            specializations: validatedData.specializations,
            employment_type: validatedData.employment_type,
            availability_status: 'available', // Default status
            total_jobs_completed: 0,
            average_rating: 0,
            total_ratings: 0,
            success_rate: 0,
          })
          .select()
          .single();

        if (insertError) {
          errors.push({
            row: rowNumber,
            field: 'database',
            message: `Failed to create engineer: ${insertError.message}`,
          });
          continue;
        }

        // Add to existing phones set to catch duplicates within the CSV
        existingPhones.add(validatedData.phone);
        createdEngineers.push(newEngineer);
        successCount++;

      } catch (error) {
        errors.push({
          row: rowNumber,
          field: 'general',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Prepare response
    const response: BulkEngineerUpload = {
      success_count: successCount,
      error_count: errors.length,
      errors: errors,
    };

    return successResponse(response, 200);

  } catch (error) {
    console.error('Unexpected error in bulk engineer upload:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      undefined,
      500
    );
  }
}
