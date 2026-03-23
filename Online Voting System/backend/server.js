// Load .env file - ensure it's loaded before anything else
const path = require('path');
const fs = require('fs');

// Try multiple possible .env locations (ONLY .env, NOT .env.example)
const envPaths = [
  path.join(__dirname, '.env'),                // backend/.env (PRIMARY)
  path.join(process.cwd(), '.env'),            // Current directory
  path.join(process.cwd(), 'backend', '.env'),  // backend/.env from root
];

const examplePath = path.join(__dirname, '.env.example');
const realEnvPath = path.join(__dirname, '.env');

if (fs.existsSync(examplePath)) {
  console.log('📋 Note: .env.example exists but will NOT be loaded (template only)');

  if (fs.existsSync(realEnvPath)) {
    console.log('   Local .env file found');
  } else {
    console.log('   Using environment variables from Render');
  }

  console.log('');
}
let envLoaded = false;
let loadedEnvPath = null;

// Manual .env parser as fallback (more reliable than dotenv for BOM issues)
function manualParseEnv(envPath) {
  try {
    const buffer = fs.readFileSync(envPath);
    console.log(`   📄 File size: ${buffer.length} bytes`);
    
    // Detect encoding
    let content;
    let encodingIssue = false;
    
    // Check for UTF-16 LE (common Windows issue)
    // UTF-16 LE files typically start with null bytes between ASCII chars
    if (buffer.length > 2 && buffer[0] !== 0 && buffer[1] === 0 && buffer[2] !== 0 && buffer[3] === 0) {
      console.log(`   ⚠️  Detected UTF-16 LE encoding (Windows issue) - converting to UTF-8`);
      content = buffer.toString('utf16le');
      encodingIssue = true;
    } else {
      // Try UTF-8 first
      content = buffer.toString('utf8');
      
      // Remove UTF-8 BOM if present
      let hadBOM = false;
      if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        hadBOM = true;
        content = buffer.slice(3).toString('utf8');
        console.log(`   ⚠️  Removed UTF-8 BOM`);
      }
      content = content.replace(/^\uFEFF/, '');
      
      // Check if content looks corrupted (has null bytes between chars - UTF-16 read as UTF-8)
      if (content.includes('\u0000') && content.match(/.\u0000.\u0000/)) {
        console.log(`   ⚠️  Content appears corrupted (likely UTF-16 read as UTF-8) - trying UTF-16 LE`);
        content = buffer.toString('utf16le');
        encodingIssue = true;
      }
    }
    
    // Parse manually
    const lines = content.split(/\r?\n/);
    console.log(`   📝 Found ${lines.length} lines in file`);
    
    let parsedCount = 0;
    let smtpUserFound = false;
    let smtpPassFound = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        if (trimmed.includes('SMTP')) {
          console.log(`   ⚠️  Skipped line ${i+1} (comment/empty): ${JSON.stringify(line)}`);
        }
        continue;
      }
      
      // More robust regex: allow for spaces around =, handle various formats
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        
        // Remove quotes if present (both single and double)
        const cleanValue = value.replace(/^["']|["']$/g, '');
        
        // Only set if value is not empty (unless it's explicitly empty string)
        if (cleanValue !== '' || value === '') {
          process.env[key] = cleanValue;
          parsedCount++;
          
          // Track SMTP vars
          if (key === 'SMTP_USER') {
            smtpUserFound = true;
            console.log(`   ✅ Parsed ${key} (line ${i+1}): ${cleanValue.substring(0, Math.min(20, cleanValue.length))}${cleanValue.length > 20 ? '...' : ''}`);
          }
          if (key === 'SMTP_PASS') {
            smtpPassFound = true;
            console.log(`   ✅ Parsed ${key} (line ${i+1}): ***${cleanValue.substring(Math.max(0, cleanValue.length - 2))}`);
          }
        } else {
          console.log(`   ⚠️  Skipped ${key} (empty value) on line ${i+1}`);
        }
      } else {
        // Log lines that don't match (especially SMTP-related)
        if (trimmed.includes('SMTP')) {
          console.log(`   ⚠️  Line ${i+1} didn't match pattern: ${JSON.stringify(line)}`);
          console.log(`      Trimmed: ${JSON.stringify(trimmed)}`);
        }
      }
    }
    
    console.log(`   ✅ Parsed ${parsedCount} environment variables`);
    
    // If we had encoding issues, rewrite file as UTF-8
    if (encodingIssue) {
      fs.writeFileSync(envPath, content, { encoding: 'utf8' });
      console.log(`   ✅ Converted and rewrote .env file as UTF-8`);
    }
    
    // Return true only if we successfully parsed SMTP vars
    const success = smtpUserFound && smtpPassFound;
    if (!success) {
      console.log(`   ⚠️  Warning: SMTP_USER=${smtpUserFound}, SMTP_PASS=${smtpPassFound}`);
    }
    
    return success;
  } catch (err) {
    console.error('   ❌ Manual env parse error:', err.message);
    console.error('   Stack:', err.stack);
    return false;
  }
}

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    console.log(`📂 Found .env file at: ${envPath}`);
    
    // Try manual parser FIRST (more reliable, handles BOM better)
    console.log(`   🔧 Step 1: Trying manual parser...`);
    const manualParseSuccess = manualParseEnv(envPath);
    const hasVars = process.env.SMTP_USER && process.env.SMTP_PASS;
    
    console.log(`   Manual parser result:`, {
      parseReturned: manualParseSuccess,
      SMTP_USER: process.env.SMTP_USER ? `Found (${process.env.SMTP_USER.length} chars): ${process.env.SMTP_USER.substring(0, 20)}...` : 'Missing',
      SMTP_PASS: process.env.SMTP_PASS ? `Found (${process.env.SMTP_PASS.length} chars)` : 'Missing',
      allSMTPKeys: Object.keys(process.env).filter(k => k.startsWith('SMTP'))
    });
    
    if (manualParseSuccess && hasVars) {
      loadedEnvPath = envPath;
      envLoaded = true;
      console.log(`✅ SUCCESS: Loaded .env from: ${envPath} (using manual parser)`);
      break;
    } else if (manualParseSuccess && !hasVars) {
      console.log(`   ⚠️  Manual parser returned success but SMTP vars are missing!`);
      console.log(`   This indicates a parsing issue. Checking raw file content...`);
      // Debug: show raw SMTP lines
      try {
        const rawContent = fs.readFileSync(envPath, 'utf8');
        const rawLines = rawContent.split(/\r?\n/);
        rawLines.forEach((line, i) => {
          if (line.includes('SMTP')) {
            console.log(`   Raw line ${i+1}: ${JSON.stringify(line)}`);
          }
        });
      } catch (e) {
        console.log(`   Error reading file: ${e.message}`);
      }
    }
    
    // Also try dotenv as backup
    console.log(`   🔧 Step 2: Trying dotenv...`);
    const result = require('dotenv').config({ path: envPath });
    const hasVarsAfterDotenv = process.env.SMTP_USER && process.env.SMTP_PASS;
    
    console.log(`   dotenv result:`, {
      error: result.error?.message || 'none',
      SMTP_USER: process.env.SMTP_USER ? `Found (${process.env.SMTP_USER.length} chars): ${process.env.SMTP_USER.substring(0, 20)}...` : 'Missing',
      SMTP_PASS: process.env.SMTP_PASS ? `Found (${process.env.SMTP_PASS.length} chars)` : 'Missing',
      allSMTPKeys: Object.keys(process.env).filter(k => k.startsWith('SMTP'))
    });
    
    if (!result.error && hasVarsAfterDotenv) {
      loadedEnvPath = envPath;
      envLoaded = true;
      console.log(`✅ SUCCESS: Loaded .env from: ${envPath} (using dotenv)`);
      break;
    }
  }
}

if (!envLoaded) {
  // Try default location
  const result = require('dotenv').config();
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('⚠️  .env file not found or variables not loaded');
    console.log('Checked paths:', envPaths);
  }
}

// Final fallback: if still missing, try manual parser one more time
if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.log('');
  console.log('⚠️  SMTP variables still missing after initial load attempts!');
  console.log('   Attempting final fallback with manual parser...');
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      console.log(`   Trying: ${envPath}`);
      if (manualParseEnv(envPath)) {
        const finalCheck = process.env.SMTP_USER && process.env.SMTP_PASS;
        if (finalCheck) {
          console.log(`✅ Final fallback succeeded: Loaded .env from: ${envPath}`);
          loadedEnvPath = envPath;
          envLoaded = true;
          break;
        } else {
          console.log(`   ⚠️  Manual parser returned true but vars still missing!`);
        }
      }
    }
  }
}

// Verify critical env vars are loaded
const smtpUser = process.env.SMTP_USER?.trim();
const smtpPass = process.env.SMTP_PASS?.trim();

console.log('🔍 Environment variables check:', {
  SMTP_USER: smtpUser ? 'Found (' + smtpUser.length + ' chars): ' + smtpUser.substring(0, 15) + '...' : 'MISSING',
  SMTP_PASS: smtpPass ? 'Found (' + smtpPass.length + ' chars)' : 'MISSING',
  SMTP_HOST: process.env.SMTP_HOST || 'not set',
  SMTP_PORT: process.env.SMTP_PORT || 'not set',
  PORT: process.env.PORT || 'Using default 5000',
  JWT_SECRET: process.env.JWT_SECRET ? 'Found' : 'MISSING',
  allEnvKeys: Object.keys(process.env).filter(k => k.startsWith('SMTP'))
});

if (!smtpUser || !smtpPass) {
  console.error('\n❌ CRITICAL: SMTP credentials not loaded!');
  console.error('This will prevent email notifications from working.');
  console.error('Please check:');
  console.error('  1. .env file exists in backend/ directory');
  console.error('  2. .env file has SMTP_USER and SMTP_PASS set');
  console.error('  3. No extra spaces or quotes in .env file');
  console.error('  4. Restart server after changing .env file');
  console.error('\n💡 Running manual parser test...');
  
  // Last resort: try to manually parse the .env file
  const testPath = path.join(__dirname, '.env');
  if (fs.existsSync(testPath)) {
    const buffer = fs.readFileSync(testPath);
    const content = buffer.toString('utf8').replace(/^\uFEFF/, '');
    const lines = content.split(/\r?\n/);
    console.log('   File has', lines.length, 'lines');
    for (const line of lines) {
      if (line.includes('SMTP_USER') || line.includes('SMTP_PASS')) {
        console.log('   Found line:', line.substring(0, 50));
      }
    }
  }
  console.log('');
}

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { connectDB } = require('./db/connection');
const { initDb } = require('./db/schema');
const authRoutes = require('./routes/auth');
const electionsRoutes = require('./routes/elections');
const votesRoutes = require('./routes/votes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/elections', electionsRoutes);
app.use('/api/votes', votesRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Email configuration test endpoint
app.get('/api/test-email', async (req, res) => {
  try {
    // Reload env vars
    require('dotenv').config();
    
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();
    const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    
    // Check if env vars are set
    if (!smtpUser || !smtpPass) {
      return res.status(500).json({ 
        error: 'Email not configured',
        message: 'SMTP_USER or SMTP_PASS is missing in .env file',
        details: {
          SMTP_USER: smtpUser ? 'Set (' + smtpUser.length + ' chars)' : 'Missing',
          SMTP_PASS: smtpPass ? 'Set (' + smtpPass.length + ' chars)' : 'Missing',
          SMTP_HOST: smtpHost,
          SMTP_PORT: smtpPort,
          tip: 'Please check your .env file in the backend/ directory and restart the server'
        }
      });
    }
    
    // Try to get transporter
    const { getTransporter } = require('./services/email');
    const trans = getTransporter();
    
    if (!trans) {
      return res.status(500).json({ 
        error: 'Email transporter creation failed',
        details: {
          SMTP_USER: smtpUser ? 'Set' : 'Missing',
          SMTP_PASS: smtpPass ? 'Set' : 'Missing',
          SMTP_HOST: smtpHost,
          SMTP_PORT: smtpPort
        }
      });
    }
    
    // Verify SMTP connection
    try {
      await trans.verify();
      return res.json({ 
        success: true, 
        message: 'Email configuration is valid and SMTP connection verified',
        config: {
          host: smtpHost,
          port: smtpPort,
          user: smtpUser.substring(0, 10) + '...',
          status: 'Ready to send emails'
        }
      });
    } catch (verifyError) {
      return res.status(500).json({ 
        error: 'SMTP verification failed',
        message: verifyError.message,
        code: verifyError.code,
        details: {
          host: smtpHost,
          port: smtpPort,
          user: smtpUser.substring(0, 10) + '...',
          tip: verifyError.code === 'EAUTH' ? 'Check your SMTP_PASS - for Gmail, use an App Password, not your regular password' : 'Check your internet connection and SMTP settings'
        }
      });
    }
  } catch (err) {
    return res.status(500).json({ 
      error: 'Error checking email configuration',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

async function start() {
  // Connect to MongoDB
  await connectDB();
  console.log('MongoDB connected');
  
  // Initialize database (create default admin if needed)
  await initDb();
  console.log('Database initialized');
  
  // Verify email configuration on startup
  console.log('\n📧 Checking email configuration...');
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (smtpUser && smtpPass) {
    console.log('✅ Email configuration found:');
    console.log(`   SMTP_USER: ${smtpUser.substring(0, 10)}...`);
    console.log(`   SMTP_PASS: ${'*'.repeat(smtpPass.length)}`);
    console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
    console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || 587}`);
  } else {
    console.log('⚠️  Email configuration missing:');
    console.log(`   SMTP_USER: ${smtpUser ? 'Set' : 'MISSING'}`);
    console.log(`   SMTP_PASS: ${smtpPass ? 'Set' : 'MISSING'}`);
    console.log('   Email notifications will not work until configured.');
  }
  console.log('');
  
  app.listen(PORT, () => {
    console.log(`Online Voting API running at http://localhost:${PORT}`);
    console.log(`Test email config: http://localhost:${PORT}/api/test-email\n`);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
