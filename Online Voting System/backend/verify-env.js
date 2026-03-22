// Simple script to verify .env file is readable
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying .env file...\n');

const envPath = path.join(__dirname, '.env');
console.log('Looking for .env at:', envPath);
console.log('File exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  // Read as buffer first to detect and remove BOM
  const buffer = fs.readFileSync(envPath);
  let content;
  
  // Remove UTF-8 BOM if present (EF BB BF)
  if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    console.log('⚠️  Found UTF-8 BOM in file, removing it for display...');
    content = buffer.slice(3).toString('utf8');
  } else {
    content = buffer.toString('utf8');
  }
  
  // Also remove BOM if present as string
  content = content.replace(/^\uFEFF/, '');
  console.log('\n📄 .env file content:');
  console.log('─'.repeat(60));
  console.log(content);
  console.log('─'.repeat(60));
  
  // Check for SMTP variables
  const lines = content.split('\n');
  const smtpUserLine = lines.find(l => l.startsWith('SMTP_USER='));
  const smtpPassLine = lines.find(l => l.startsWith('SMTP_PASS='));
  
  console.log('\n📧 SMTP Configuration:');
  if (smtpUserLine) {
    const value = smtpUserLine.split('=')[1]?.trim();
    console.log('  SMTP_USER:', value ? `Found (${value.length} chars)` : 'Empty');
    console.log('    Value:', value?.substring(0, 20) + '...');
  } else {
    console.log('  SMTP_USER: NOT FOUND');
  }
  
  if (smtpPassLine) {
    const value = smtpPassLine.split('=')[1]?.trim();
    console.log('  SMTP_PASS:', value ? `Found (${value.length} chars)` : 'Empty');
    console.log('    Value:', value ? '***' + value.substring(value.length - 2) : 'Empty');
  } else {
    console.log('  SMTP_PASS: NOT FOUND');
  }
  
  // Now test loading with dotenv
  console.log('\n🔄 Testing dotenv loading...');
  require('dotenv').config({ path: envPath });
  
  console.log('\n✅ After dotenv.config():');
  console.log('  process.env.SMTP_USER:', process.env.SMTP_USER || 'UNDEFINED');
  console.log('  process.env.SMTP_PASS:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.substring(process.env.SMTP_PASS.length - 2) : 'UNDEFINED');
  
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log('\n✅ SUCCESS: Environment variables loaded correctly!');
  } else {
    console.log('\n❌ FAILED: Environment variables not loaded');
    console.log('\nPossible issues:');
    console.log('  1. File encoding (should be UTF-8)');
    console.log('  2. Hidden characters or BOM');
    console.log('  3. Line endings (should be LF or CRLF)');
    console.log('  4. Extra spaces around = sign');
  }
} else {
  console.log('\n❌ .env file not found!');
  console.log('Please create .env file in:', __dirname);
}
