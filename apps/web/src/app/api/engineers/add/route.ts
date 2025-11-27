/**
 * Mock Engineer Creation API Route
 * POST /api/engineers/add - Add a new engineer (mock implementation)
 * 
 * This is a temporary endpoint for testing engineer creation
 * without requiring a real database connection.
 */

import { NextRequest, NextResponse } from 'next/server';
import { engineerSchema } from '@cueron/utils/src/schemas';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validation = engineerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid engineer data',
            details: validation.error.flatten().fieldErrors
          }
        },
        { status: 400 }
      );
    }

    const engineerData = validation.data;

    // Simulate checking phone uniqueness (always succeeds in mock)
    // In a real implementation, this would check the database
    
    // Simulate creating engineer with default values
    const mockEngineer = {
      id: 'eng_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      agency_id: engineerData.agency_id,
      name: engineerData.name,
      phone: engineerData.phone,
      email: engineerData.email,
      photo_url: engineerData.photo_url,
      certifications: engineerData.certifications || [],
      skill_level: engineerData.skill_level,
      specializations: engineerData.specializations || [],
      employment_type: engineerData.employment_type,
      availability_status: 'available',
      total_jobs_completed: 0,
      average_rating: 0,
      total_ratings: 0,
      success_rate: 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('✅ Mock engineer created successfully:', mockEngineer.id);
    
    return NextResponse.json({ engineer: mockEngineer }, { status: 201 });
  } catch (error) {
    console.error('Error creating mock engineer:', error);
    return NextResponse.json(
      { error: { message: 'Failed to create mock engineer' } },
      { status: 500 }
    );
  }
}