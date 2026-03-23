require('dotenv').config();

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
