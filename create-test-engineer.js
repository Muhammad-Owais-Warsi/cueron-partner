// Script to create a test engineer via the API
const agencyId = 'test-agency-id'; // Replace with a valid agency ID from your database

const testEngineerData = {
  agency_id: agencyId,
  name: 'Test Engineer',
  phone: '9876543210', // Valid Indian phone number
  email: 'test.engineer@example.com',
  skill_level: 3,
  specializations: ['HVAC', 'Refrigeration'],
  certifications: [
    {
      type: 'ITI',
      level: 2,
      cert_number: 'ITI123456',
      verified: true
    }
  ],
  employment_type: 'full_time'
};

async function createTestEngineer() {
  try {
    console.log('Creating test engineer...');
    console.log('Agency ID:', agencyId);
    console.log('Engineer Data:', JSON.stringify(testEngineerData, null, 2));
    
    // Note: This will fail if the agency doesn't exist in the database
    // You'll need to use a real agency ID from your database
    const response = await fetch(`http://localhost:3000/api/agencies/${agencyId}/engineers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEngineerData),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Engineer created successfully!');
      console.log('Engineer ID:', result.engineer.id);
    } else {
      console.log('❌ Failed to create engineer');
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.log('❌ Error creating engineer:', error.message);
  }
}

createTestEngineer();