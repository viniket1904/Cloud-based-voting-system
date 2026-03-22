const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Manual .env parser function
function manualParseEnv(envPath) {
  try {
    const buffer = fs.readFileSync(envPath);
    let content = buffer.toString('utf8');
    
    // Remove BOM
    if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
      content = buffer.slice(3).toString('utf8');
    }
    content = content.replace(/^\uFEFF/, '');
    
    // Parse manually
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    }
    return true;
  } catch (err) {
    return false;
  }
}

// Note: server.js should load .env before this module is required
// This is just a fallback in case server.js didn't load it
const envPath = path.join(__dirname, '..', '.env'); // backend/.env

// Only try to load if variables are missing (they should already be loaded by server.js)
if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.log('⚠️  Email service: Variables missing, attempting to load .env...');
  
  if (fs.existsSync(envPath)) {
    // Try dotenv first
    const result = require('dotenv').config({ path: envPath });
    
    // If still missing, try manual parse
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('⚠️  dotenv failed, trying manual parser...');
      if (manualParseEnv(envPath)) {
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
          console.log(`✅ Email service: Loaded .env using manual parser`);
        } else {
          console.log(`❌ Email service: Manual parser also failed`);
        }
      }
    } else {
      console.log(`✅ Email service: Loaded .env using dotenv`);
    }
  } else {
    console.log(`❌ Email service: .env file not found at ${envPath}`);
    // Try default
    require('dotenv').config();
  }
}

let transporter = null;

function getTransporter() {
  // Always check fresh env vars (don't cache if they're missing)
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = Number(process.env.SMTP_PORT) || 587;
  
  console.log('📧 Email configuration check:', {
    hasUser: !!user,
    hasPass: !!pass,
    userLength: user?.length || 0,
    passLength: pass?.length || 0,
    host: host,
    port: port,
    userEmail: user ? user.substring(0, 10) + '...' : 'missing',
    envFile: path.join(__dirname, '..', '.env')
  });
  
  // Debug: Show all SMTP-related env vars
  console.log('🔍 All SMTP env vars:', {
    SMTP_USER: user || 'UNDEFINED',
    SMTP_PASS: pass ? '***' + pass.substring(pass.length - 2) : 'UNDEFINED',
    SMTP_HOST: host,
    SMTP_PORT: port,
    NODE_ENV: process.env.NODE_ENV
  });
  
  if (!user || !pass || user === '' || pass === '') {
    console.error('❌ SMTP not configured properly. Missing SMTP_USER or SMTP_PASS in .env file');
    console.error('Current env vars:', {
      SMTP_USER: user || 'MISSING',
      SMTP_PASS: pass ? '***' : 'MISSING',
      SMTP_HOST: host,
      SMTP_PORT: port
    });
    console.error('💡 Tip: Make sure .env file is in the backend/ directory and restart the server');
    return null;
  }
  
  // Recreate transporter if env vars changed or if it doesn't exist
  if (!transporter || transporter.options.auth.user !== user) {
    try {
      transporter = nodemailer.createTransport({
        host: host,
        port: port,
        secure: false, // true for 465, false for other ports
        auth: { 
          user: user, 
          pass: pass 
        },
        tls: {
          rejectUnauthorized: false // For Gmail
        }
      });
      console.log('✅ Email transporter created successfully');
    } catch (err) {
      console.error('❌ Failed to create email transporter:', err.message);
      return null;
    }
  }
  
  return transporter;
}

async function sendElectionNotification(toEmail, voterName, electionName, startDate, endDate) {
  // Reload .env if variables are missing (shouldn't be needed if server.js loaded it)
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      require('dotenv').config({ path: envPath, override: true });
      console.log('⚠️  Email service: Had to reload .env file');
    } else {
      require('dotenv').config({ override: true });
    }
  }
  
  // Verify email configuration first
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  
  // Debug: Show what we're getting
  console.log('🔍 Environment check in sendElectionNotification:', {
    SMTP_USER: user ? user.substring(0, 15) + '... (' + user.length + ' chars)' : 'UNDEFINED',
    SMTP_PASS: pass ? '***' + pass.substring(pass.length - 2) + ' (' + pass.length + ' chars)' : 'UNDEFINED',
    SMTP_HOST: process.env.SMTP_HOST || 'not set',
    SMTP_PORT: process.env.SMTP_PORT || 'not set',
    allSMTPKeys: Object.keys(process.env).filter(k => k.includes('SMTP')),
    cwd: process.cwd(),
    __dirname: __dirname
  });
  
  console.log(`📧 Attempting to send email to ${toEmail}...`);
  console.log(`🔐 SMTP_USER check: ${user ? 'Found (' + user.length + ' chars)' : 'MISSING'}`);
  console.log(`🔐 SMTP_PASS check: ${pass ? 'Found (' + pass.length + ' chars)' : 'MISSING'}`);
  
  if (!user || !pass || user === '' || pass === '') {
    console.error(`❌ Cannot send email to ${toEmail}: SMTP credentials missing`);
    console.error('Please check your .env file has SMTP_USER and SMTP_PASS set');
    console.error('Current values:', {
      SMTP_USER: user || 'UNDEFINED',
      SMTP_PASS: pass ? '***' : 'UNDEFINED'
    });
    return { sent: false, reason: 'Email not configured. Please set SMTP_USER and SMTP_PASS in .env file and restart the server' };
  }
  
  const trans = getTransporter();
  if (!trans) {
    console.error(`❌ Cannot send email to ${toEmail}: Transporter creation failed`);
    return { sent: false, reason: 'Email transporter failed to initialize. Check SMTP configuration in .env file' };
  }
  
  if (!toEmail || !voterName) {
    return { sent: false, reason: 'Missing email or voter name' };
  }
  
  try {
    const mailOptions = {
      from: `"Voting Commission" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `New Election: ${electionName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .election-info { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #3b82f6; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🗳️ Election Notification</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${voterName}</strong>,</p>
              <p>A new election has been created on the Cloud Based Voting System.</p>
              <div class="election-info">
                <h2>${electionName}</h2>
                <p><strong>Start Date:</strong> ${startDate}</p>
                <p><strong>End Date:</strong> ${endDate}</p>
              </div>
              <p>Please log in to the system to cast your vote. Each voter can cast only one vote per election.</p>
              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="button">Go to Voting System</a>
              </p>
              <p><strong>Important:</strong> You will need to verify your identity using face recognition when casting your vote.</p>
            </div>
            <div class="footer">
              <p>— Voting Commission</p>
              <p>This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Election Notification

Dear ${voterName},

A new election has been created on the Cloud Based Voting System.

Election: ${electionName}
Start Date: ${startDate}
End Date: ${endDate}

Please log in to the portal to cast your vote: ${process.env.FRONTEND_URL || 'http://localhost:5173'}

Important: You will need to verify your identity using face recognition when casting your vote.

— Voting Commission
      `,
    };
    
    // Note: Removed verify() call - it adds unnecessary latency (1-2 seconds per email)
    // The sendMail() call will fail fast if there's a connection issue anyway
    console.log(`📧 Sending email to ${toEmail}...`);
    
    const info = await trans.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${toEmail}. MessageId: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (e) {
    console.error(`❌ Email send error to ${toEmail}:`, e.message);
    console.error('Error details:', {
      code: e.code,
      responseCode: e.responseCode,
      response: e.response,
      command: e.command
    });
    
    // More detailed error information
    let reason = e.message;
    if (e.code === 'EAUTH') {
      reason = 'SMTP authentication failed. Check SMTP_USER and SMTP_PASS in .env file. For Gmail, use an App Password, not your regular password.';
    } else if (e.code === 'ECONNECTION') {
      reason = `Cannot connect to SMTP server ${process.env.SMTP_HOST || 'smtp.gmail.com'}:${process.env.SMTP_PORT || 587}. Check your internet connection and SMTP settings.`;
    } else if (e.responseCode === 535) {
      reason = 'SMTP authentication failed. Gmail app password may be incorrect or expired. Generate a new App Password from Google Account settings.';
    } else if (e.code === 'ETIMEDOUT') {
      reason = 'SMTP connection timeout. Check your internet connection and firewall settings.';
    }
    return { sent: false, reason: reason };
  }
}

// Send notification when election becomes active
async function sendElectionActiveNotification(toEmail, voterName, electionName, startDate, endDate) {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  
  if (!user || !pass || user === '' || pass === '') {
    return { sent: false, reason: 'Email not configured' };
  }
  
  const trans = getTransporter();
  if (!trans) {
    return { sent: false, reason: 'Email transporter failed to initialize' };
  }
  
  if (!toEmail || !voterName) {
    return { sent: false, reason: 'Missing email or voter name' };
  }
  
  try {
    const mailOptions = {
      from: `"Voting Commission" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `Election Now Active: ${electionName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .election-info { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #10b981; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🗳️ Election Now Active</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${voterName}</strong>,</p>
              <p>The election <strong>${electionName}</strong> is now <strong>ACTIVE</strong> and voting is open!</p>
              <div class="election-info">
                <h2>${electionName}</h2>
                <p><strong>Start Date:</strong> ${startDate}</p>
                <p><strong>End Date:</strong> ${endDate}</p>
                <p><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">ACTIVE - Voting Open</span></p>
              </div>
              <p>You can now cast your vote on the Cloud Based Voting System. Each voter can cast only one vote per election.</p>
              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="button">Cast Your Vote Now</a>
              </p>
              <p><strong>Important:</strong> You will need to verify your identity using face recognition when casting your vote.</p>
            </div>
            <div class="footer">
              <p>— Voting Commission</p>
              <p>This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Election Now Active: ${electionName}

Dear ${voterName},

The election "${electionName}" is now ACTIVE and voting is open!

Start Date: ${startDate}
End Date: ${endDate}
Status: ACTIVE - Voting Open

You can now cast your vote: ${process.env.FRONTEND_URL || 'http://localhost:5173'}

Important: You will need to verify your identity using face recognition when casting your vote.

— Voting Commission`,
    };
    
    console.log(`📧 Sending ACTIVE election notification to ${toEmail}...`);
    const info = await trans.sendMail(mailOptions);
    console.log(`✅ Active notification sent to ${toEmail}. MessageId: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (e) {
    console.error(`❌ Error sending active notification to ${toEmail}:`, e.message);
    return { sent: false, reason: e.message };
  }
}

// Send notification when election ends
async function sendElectionEndedNotification(toEmail, voterName, electionName, startDate, endDate) {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  
  if (!user || !pass || user === '' || pass === '') {
    return { sent: false, reason: 'Email not configured' };
  }
  
  const trans = getTransporter();
  if (!trans) {
    return { sent: false, reason: 'Email transporter failed to initialize' };
  }
  
  if (!toEmail || !voterName) {
    return { sent: false, reason: 'Missing email or voter name' };
  }
  
  try {
    const mailOptions = {
      from: `"Voting Commission" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `Election Ended: ${electionName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .election-info { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #ef4444; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #6b7280; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Election Ended</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${voterName}</strong>,</p>
              <p>The election <strong>${electionName}</strong> has <strong>ENDED</strong>.</p>
              <div class="election-info">
                <h2>${electionName}</h2>
                <p><strong>Start Date:</strong> ${startDate}</p>
                <p><strong>End Date:</strong> ${endDate}</p>
                <p><strong>Status:</strong> <span style="color: #ef4444; font-weight: bold;">ENDED - Voting Closed</span></p>
              </div>
              <p>Voting for this election is now closed. Results will be announced once they are declared by the election commission.</p>
              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="button">View Election Details</a>
              </p>
              <p>Thank you for participating in the democratic process!</p>
            </div>
            <div class="footer">
              <p>— Voting Commission</p>
              <p>This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Election Ended: ${electionName}

Dear ${voterName},

The election "${electionName}" has ENDED.

Start Date: ${startDate}
End Date: ${endDate}
Status: ENDED - Voting Closed

Voting for this election is now closed. Results will be announced once they are declared.

Thank you for participating in the democratic process!

— Voting Commission`,
    };
    
    console.log(`📧 Sending ENDED election notification to ${toEmail}...`);
    const info = await trans.sendMail(mailOptions);
    console.log(`✅ Ended notification sent to ${toEmail}. MessageId: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (e) {
    console.error(`❌ Error sending ended notification to ${toEmail}:`, e.message);
    return { sent: false, reason: e.message };
  }
}

// Send notification when results are declared
async function sendResultsDeclaredNotification(toEmail, voterName, electionName, results) {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  
  if (!user || !pass || user === '' || pass === '') {
    return { sent: false, reason: 'Email not configured' };
  }
  
  const trans = getTransporter();
  if (!trans) {
    return { sent: false, reason: 'Email transporter failed to initialize' };
  }
  
  if (!toEmail || !voterName) {
    return { sent: false, reason: 'Missing email or voter name' };
  }
  
  // Format results table
  const resultsHtml = results && results.length > 0 ? `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white;">
      <thead>
        <tr style="background-color: #3b82f6; color: white;">
          <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Rank</th>
          <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Party</th>
          <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Votes</th>
        </tr>
      </thead>
      <tbody>
        ${results.map((party, index) => `
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${index + 1}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${party.name}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${party.vote_count || 0}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '<p>No votes were cast in this election.</p>';
  
  const totalVotes = results ? results.reduce((sum, p) => sum + (p.vote_count || 0), 0) : 0;
  const winner = results && results.length > 0 && results[0].vote_count > 0 ? results[0] : null;
  
  try {
    const mailOptions = {
      from: `"Voting Commission" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `Results Declared: ${electionName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #8b5cf6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .results-section { background-color: white; padding: 20px; margin: 15px 0; border-left: 4px solid #8b5cf6; }
            .winner { background-color: #fef3c7; padding: 15px; margin: 15px 0; border-left: 4px solid #f59e0b; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #8b5cf6; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 10px; text-align: left; border: 1px solid #ddd; }
            th { background-color: #3b82f6; color: white; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Election Results Declared</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${voterName}</strong>,</p>
              <p>The results for <strong>${electionName}</strong> have been <strong>DECLARED</strong>!</p>
              ${winner ? `
                <div class="winner">
                  <h2 style="margin-top: 0;">🏆 Winner: ${winner.name}</h2>
                  <p><strong>Total Votes:</strong> ${winner.vote_count}</p>
                </div>
              ` : ''}
              <div class="results-section">
                <h2>Election Results</h2>
                <p><strong>Total Votes Cast:</strong> ${totalVotes}</p>
                ${resultsHtml}
              </div>
              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="button">View Full Results</a>
              </p>
              <p>Thank you for participating in the democratic process!</p>
            </div>
            <div class="footer">
              <p>— Voting Commission</p>
              <p>This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Results Declared: ${electionName}

Dear ${voterName},

The results for "${electionName}" have been DECLARED!

${winner ? `Winner: ${winner.name} (${winner.vote_count} votes)\n\n` : ''}Election Results:
Total Votes Cast: ${totalVotes}

${results && results.length > 0 ? results.map((p, i) => `${i + 1}. ${p.name}: ${p.vote_count || 0} votes`).join('\n') : 'No votes were cast.'}

View full results: ${process.env.FRONTEND_URL || 'http://localhost:5173'}

Thank you for participating!

— Voting Commission`,
    };
    
    console.log(`📧 Sending RESULTS DECLARED notification to ${toEmail}...`);
    const info = await trans.sendMail(mailOptions);
    console.log(`✅ Results notification sent to ${toEmail}. MessageId: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (e) {
    console.error(`❌ Error sending results notification to ${toEmail}:`, e.message);
    return { sent: false, reason: e.message };
  }
}

module.exports = { 
  sendElectionNotification,  // Keep for backward compatibility (sends active notification)
  sendElectionActiveNotification,
  sendElectionEndedNotification,
  sendResultsDeclaredNotification,
  getTransporter 
};
