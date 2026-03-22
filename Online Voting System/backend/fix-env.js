// Script to fix .env file encoding issues
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

console.log('🔧 Fixing .env file encoding...\n');

if (fs.existsSync(envPath)) {
  // Read file as binary to detect BOM
  const buffer = fs.readFileSync(envPath);
  
  // Check for BOM (UTF-8 BOM is EF BB BF)
  let content;
  if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    console.log('⚠️  Found UTF-8 BOM, removing it...');
    content = buffer.slice(3).toString('utf8');
  } else {
    content = buffer.toString('utf8');
  }
  
  // Remove any other hidden characters
  content = content.replace(/^\uFEFF/, ''); // Remove BOM if present as string
  
  // Clean up the content
  const lines = content.split(/\r?\n/);
  const cleanedLines = lines.map(line => {
    // Remove trailing spaces
    return line.trimEnd();
  }).filter(line => line.length > 0); // Remove empty lines
  
  // Recreate file without BOM
  const cleanedContent = cleanedLines.join('\n') + '\n';
  
  // Write back as UTF-8 without BOM
  fs.writeFileSync(envPath, cleanedContent, { encoding: 'utf8' });
  
  console.log('✅ .env file cleaned and saved (UTF-8 without BOM)');
  console.log(`   Lines: ${cleanedLines.length}`);
  
  // Test loading
  console.log('\n🔄 Testing dotenv loading...');
  delete require.cache[require.resolve('dotenv')];
  require('dotenv').config({ path: envPath });
  
  console.log('\n✅ Environment variables after fix:');
  console.log('─'.repeat(60));
  console.log('SMTP_USER:', process.env.SMTP_USER || 'NOT FOUND');
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.substring(process.env.SMTP_PASS.length - 2) : 'NOT FOUND');
  console.log('SMTP_HOST:', process.env.SMTP_HOST || 'NOT FOUND');
  console.log('SMTP_PORT:', process.env.SMTP_PORT || 'NOT FOUND');
  console.log('PORT:', process.env.PORT || 'NOT FOUND');
  console.log('─'.repeat(60));
  
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log('\n✅ SUCCESS: Environment variables loaded correctly!');
    console.log('Now restart your backend server.');
  } else {
    console.log('\n❌ Still having issues. Please check the .env file manually.');
  }
} else {
  console.log('❌ .env file not found at:', envPath);
}
