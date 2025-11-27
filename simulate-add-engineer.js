// Script to simulate adding a new engineer
const engineerData = {
  name: 'anurag dubey',
  phone: '8660673552',
  email: null,
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
  specializations: [],
  agency_id: null,
  availability_status: 'available',
  total_jobs_completed: 0,
  average_rating: 0,
  total_ratings: 0,
  success_rate: 100
};

console.log('Simulating engineer creation...');
console.log('Engineer Data:', JSON.stringify(engineerData, null, 2));

// Generate a mock ID
const mockId = 'eng_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
console.log('\n✅ Engineer would be created with ID:', mockId);
console.log('\n📋 Summary of engineer to be added:');
console.log('  Name:', engineerData.name);
console.log('  Phone:', engineerData.phone);
console.log('  Email:', engineerData.email || 'Not provided');
console.log('  Employment Type:', engineerData.employment_type);
console.log('  Skill Level:', engineerData.skill_level);
console.log('  Certifications:', engineerData.certifications.length);
console.log('  Agency ID:', engineerData.agency_id || 'Not assigned');

console.log('\n📝 Next steps to actually add this engineer:');
console.log('1. Set up Supabase credentials in apps/web/.env.local');
console.log('2. Restart the development server');
console.log('3. Use the web interface or API to add the engineer');