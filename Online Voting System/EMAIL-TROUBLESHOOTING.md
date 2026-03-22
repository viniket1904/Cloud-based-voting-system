# Email Troubleshooting Guide

## Quick Check: Is Your Backend Server Running?

**First, make sure your backend server is running!**

1. Check if you see this in your terminal:
   ```
   Online Voting API running at http://localhost:5000
   ```

2. If not running, start it:
   ```powershell
   cd "D:\OVS\Online Voting System\backend"
   npm run dev
   ```

## Check Email Configuration (Easiest Method)

### Method 1: Check Backend Console Logs

When you start the backend server, you should see:

```
📧 Checking email configuration...
✅ Email configuration found:
   SMTP_USER: viniketpaw...
   SMTP_PASS: ************
   SMTP_HOST: smtp.gmail.com
   SMTP_PORT: 587
```

**If you see "⚠️ Email configuration missing"**, your .env file isn't being read.

### Method 2: Check .env File

1. Open: `D:\OVS\Online Voting System\backend\.env`
2. Verify it has these lines (no quotes, no spaces around `=`):
   ```
   SMTP_USER=viniketpawar007@gmail.com
   SMTP_PASS=wnsgqwxnipnqwbaw
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   ```

### Method 3: Test Endpoint (If Server is Running)

If your server is running, try:
```
http://localhost:5000/api/test-email
```

**If page says "isn't working"**:
- Server might not be running
- Check backend terminal for errors
- Try: `http://localhost:5000/api/health` (should show `{"ok":true}`)

## Common Issues

### Issue 1: "This page isn't working"
**Cause**: Backend server not running or crashed
**Solution**:
1. Check backend terminal
2. Restart server: `npm run dev`
3. Look for error messages

### Issue 2: "Email not configured"
**Cause**: .env file not being read
**Solution**:
1. Ensure `.env` is in `backend/` directory
2. Restart server after changing `.env`
3. Check backend console for email configuration status

### Issue 3: "SMTP authentication failed"
**Cause**: Wrong password (especially for Gmail)
**Solution**:
1. For Gmail, you MUST use an App Password
2. Regular Gmail password won't work
3. Generate App Password:
   - Google Account → Security
   - Enable 2-Step Verification
   - Generate App Password for "Mail"
   - Use that 16-character password

## Step-by-Step Fix

1. **Check server is running**
   - Look at backend terminal
   - Should see: "Online Voting API running at http://localhost:5000"

2. **Check .env file**
   - Location: `backend/.env`
   - Format: `SMTP_USER=email@gmail.com` (no quotes, no spaces)

3. **Restart server**
   - Stop server (Ctrl+C)
   - Start again: `npm run dev`
   - Check startup logs for email configuration status

4. **Try sending notifications**
   - Go to Admin panel
   - Click "Notify voters by email"
   - Check backend console for detailed logs

5. **Check backend console logs**
   - When clicking "Notify voters", you should see:
   ```
   📧 Email configuration check: { hasUser: true, hasPass: true, ... }
   ✅ Email transporter created successfully
   ✅ SMTP connection verified
   ✅ Email sent successfully to...
   ```

## Still Not Working?

Check backend console logs - they will show exactly what's wrong:
- Missing env vars
- SMTP connection errors
- Authentication failures
- Network issues

The logs are your best friend for debugging!
