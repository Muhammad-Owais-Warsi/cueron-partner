// Script to add the new engineer with the provided details
const engineerData = {
  // Using the Delhi ITI Center agency ID from seed data
  agency_id: '11111111-1111-1111-1111-111111111111',
  name: 'anurag dubey',
  phone: '8660673552',
  // email: undefined, // Not provided - omitting this field entirely
  skill_level: 3,
  employment_type: 'full_time',
  certifications: [
    // Need to provide at least one certification with proper structure
    {
      type: 'ITI', // Defaulting to ITI as seen in the form
      level: 1,    // Defaulting to level 1
      cert_number: 'CERT-NUMBER-UNKNOWN', // Placeholder since not provided
      verified: false
    }
  ],
  specializations: []
};

async function addEngineer() {
  try {
    console.log('Adding new engineer...');
    console.log('Engineer Data:', JSON.stringify(engineerData, null, 2));
    
    // Use the mock endpoint
    const response = await fetch('http://localhost:3001/api/engineers/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(engineerData),
    });
    
    // Handle case where response is not JSON
    let result;
    const textResponse = await response.text();
    
    try {
      result = JSON.parse(textResponse);
    } catch (parseError) {
      console.log('❌ Failed to parse response as JSON');
      console.log('Response text:', textResponse);
      console.log('Status:', response.status);
      console.log('Status text:', response.statusText);
      return;
    }
    
    if (response.ok) {
      console.log('✅ Engineer created successfully!');
      console.log('Engineer ID:', result.engineer.id);
      console.log('Engineer Details:', result.engineer);
    } else {
      console.log('❌ Failed to create engineer');
      console.log('Status:', response.status);
      console.log('Error:', result.error);
      
      // If it's a validation error, show details
      if (result.error?.details) {
        console.log('Validation Details:', JSON.stringify(result.error.details, null, 2));
      }
    }
  } catch (error) {
    console.log('❌ Error creating engineer:', error.message);
  }
}

addEngineer();