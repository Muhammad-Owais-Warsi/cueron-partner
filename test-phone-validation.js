// Test phone number validation
const phoneRegex = /^[6-9]\d{9}$/;

// Valid phone numbers
const validNumbers = [
  '9876543210',
  '8765432109',
  '7654321098',
  '6543210987'
];

// Invalid phone numbers
const invalidNumbers = [
  '1234567890', // Doesn't start with 6-9
  '987654321',  // Too short
  '98765432101', // Too long
  '987654321a', // Contains letter
  '5876543210'  // Starts with 5
];

console.log('Testing valid phone numbers:');
validNumbers.forEach(number => {
  const isValid = phoneRegex.test(number);
  console.log(`${number}: ${isValid ? '✓ Valid' : '✗ Invalid'}`);
});

console.log('\nTesting invalid phone numbers:');
invalidNumbers.forEach(number => {
  const isValid = phoneRegex.test(number);
  console.log(`${number}: ${isValid ? '✓ Valid' : '✗ Invalid'}`);
});