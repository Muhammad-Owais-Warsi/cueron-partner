// Debug script to add the new engineer with detailed error logging
const engineerData = {
  name: 'anurag dubey',
  phone: '8660673552',
  skill_level: 3,
  employment_type: 'full_time',
  certifications: [
    {
      type: 'ITI',
      level: 1,
      cert_number: 'CERT-NUMBER-UNKNOWN',
      verified: false
    }
  ],
  specializations: []
};

async function debugAddEngineer() {
  try {
    console.log('Attempting to add new engineer...');
    console.log('Request URL: http://localhost:3000/api/agencies/unknown/engineers');
    console.log('Request Data:', JSON.stringify(engineerData, null, 2));
    
    const response = await fetch('http://localhost:3000/api/agencies/unknown/engineers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(engineerData),
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Status Text:', response.statusText);
    
    // Get response headers
    console.log('Response Headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    // Try to get response text
    const responseText = await response.text();
    console.log('Response Text:', responseText);
    
    // Try to parse as JSON
    try {
      const result = JSON.parse(responseText);
      console.log('Parsed Response:', JSON.stringify(result, null, 2));
    } catch (parseError) {
      console.log('Could not parse response as JSON');
    }
    
  } catch (error) {
    console.log('Network Error:', error.message);
    console.log('Error stack:', error.stack);
  }
}

debugAddEngineer();