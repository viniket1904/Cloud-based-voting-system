// Quick script to check if .env file is being loaded correctly
require('dotenv').config();
const path = require('path');
const fs = require('fs');

console.log('🔍 Environment Variable Check\n');
console.log('Current directory:', __dirname);
console.log('.env file path:', path.join(__dirname, '.env'));
console.log('.env file exists:', fs.existsSync(path.join(__dirname, '.env')));
console.log('');

const envVars = {
  'SMTP_USER': process.env.SMTP_USER,
  'SMTP_PASS': process.env.SMTP_PASS,
  'SMTP_HOST': process.env.SMTP_HOST,
  'SMTP_PORT': process.env.SMTP_PORT,
  'PORT': process.env.PORT,
  'JWT_SECRET': process.env.JWT_SECRET ? 'Set' : 'Missing'
};

console.log('Environment Variables:');
console.log('─'.repeat(50));
for (const [key, value] of Object.entries(envVars)) {
  if (key === 'SMTP_PASS' && value) {
    console.log(`${key}: ${'*'.repeat(value.length)} (${value.length} chars)`);
  } else if (key === 'SMTP_USER' && value) {
    console.log(`${key}: ${value.substring(0, 15)}... (${value.length} chars)`);
  } else {
    console.log(`${key}: ${value || 'MISSING'}`);
  }
}
console.log('─'.repeat(50));

if (envVars.SMTP_USER && envVars.SMTP_PASS) {
  console.log('\n✅ Email configuration is present');
} else {
  console.log('\n❌ Email configuration is missing');
  console.log('Please check your .env file in the backend/ directory');
}
