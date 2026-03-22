// Test script to verify .env file is being loaded
const path = require('path');
const fs = require('fs');

console.log('🔍 Testing .env file loading...\n');
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('');

// Try different paths
const possiblePaths = [
  path.join(__dirname, '.env'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'backend', '.env'),
  'D:\\OVS\\Online Voting System\\backend\\.env'
];

console.log('Checking for .env file in these locations:');
for (const envPath of possiblePaths) {
  const exists = fs.existsSync(envPath);
  console.log(`  ${exists ? '✅' : '❌'} ${envPath}`);
  if (exists) {
    console.log(`     File size: ${fs.statSync(envPath).size} bytes`);
    // Read first few lines
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n').slice(0, 3);
    console.log(`     First lines: ${lines.join(' | ')}`);
  }
}

console.log('\nLoading .env...');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('\nEnvironment variables after loading:');
console.log('─'.repeat(60));
console.log('SMTP_USER:', process.env.SMTP_USER || 'NOT FOUND');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.substring(process.env.SMTP_PASS.length - 2) : 'NOT FOUND');
console.log('SMTP_HOST:', process.env.SMTP_HOST || 'NOT FOUND');
console.log('SMTP_PORT:', process.env.SMTP_PORT || 'NOT FOUND');
console.log('PORT:', process.env.PORT || 'NOT FOUND');
console.log('─'.repeat(60));

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  console.log('\n✅ SUCCESS: Environment variables loaded correctly!');
} else {
  console.log('\n❌ FAILED: Environment variables not loaded');
  console.log('\nTroubleshooting:');
  console.log('1. Make sure .env file is in: backend/.env');
  console.log('2. Check file has no BOM or encoding issues');
  console.log('3. Ensure no extra spaces or quotes around values');
  console.log('4. Format should be: SMTP_USER=email@gmail.com (no spaces)');
}
