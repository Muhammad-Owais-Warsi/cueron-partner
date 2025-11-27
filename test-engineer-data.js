const { engineerSchema } = require('./packages/utils/src/schemas');

// Test data that should be valid
const validEngineerData = {
  agency_id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'John Doe',
  phone: '9876543210', // Valid Indian phone number
  email: 'john.doe@example.com',
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

// Test data with invalid phone number
const invalidEngineerData = {
  agency_id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Jane Doe',
  phone: '1234567890', // Invalid - doesn't start with 6-9
  email: 'jane.doe@example.com',
  skill_level: 4,
  specializations: ['HVAC'],
  certifications: [],
  employment_type: 'part_time'
};

console.log('Testing valid engineer data:');
const validResult = engineerSchema.safeParse(validEngineerData);
console.log('Valid:', validResult.success);
if (!validResult.success) {
  console.log('Validation errors:', validResult.error.flatten().fieldErrors);
}

console.log('\nTesting invalid engineer data:');
const invalidResult = engineerSchema.safeParse(invalidEngineerData);
console.log('Valid:', invalidResult.success);
if (!invalidResult.success) {
  console.log('Validation errors:', invalidResult.error.flatten().fieldErrors);
}