const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Starting basic server for Cueron Partner Platform...\n');

// Function to start the Next.js development server
function startDevServer() {
  console.log('Starting Next.js development server...');
  
  const devProcess = exec('cd apps/web && pnpm dev', { cwd: path.join(__dirname) });
  
  devProcess.stdout.on('data', (data) => {
    console.log(`[Next.js] ${data}`);
  });
  
  devProcess.stderr.on('data', (data) => {
    console.log(`[Next.js ERROR] ${data}`);
  });
  
  devProcess.on('close', (code) => {
    console.log(`[Next.js] Process exited with code ${code}`);
  });
}

// Start the server
startDevServer();

console.log('💡 Server should be available at http://localhost:3001');
console.log('💡 Check the terminal output for any error messages');
console.log('💡 If you see "Internal Server Error", check the specific API routes that are failing');