# .env vs .env.example

## Important: Two Different Files

Your project has TWO files:

1. **`.env`** - **ACTUAL configuration** (this is what the app uses)
   - `SMTP_USER=viniketpawar007@gmail.com`
   - `SMTP_PASS=wnsgqwxnipnqwbaw`

2. **`.env.example`** - **TEMPLATE file** (for reference only, NOT loaded)
   - `SMTP_USER=yadnyavalkyakd.a04@gmail.com`
   - `SMTP_PASS=tyugyixtnqzxodzx`

## Which File is Used?

✅ **ONLY `.env` file is loaded** - The application reads from `.env` only
❌ **`.env.example` is NEVER loaded** - It's just a template for reference

## Current Configuration

Your `.env` file has:
```
SMTP_USER=viniketpawar007@gmail.com
SMTP_PASS=wnsgqwxnipnqwbaw
```

This is what the application will use.

## If You Want to Change Email Account

If you want to use the email from `.env.example` instead:

1. **Edit `.env` file** (NOT `.env.example`)
2. Change the values:
   ```
   SMTP_USER=yadnyavalkyakd.a04@gmail.com
   SMTP_PASS=tyugyixtnqzxodzx
   ```
3. **Restart backend server**

## Important Notes

- `.env.example` is just a template - it's never loaded by the application
- Always edit `.env` file to change configuration
- `.env.example` is typically committed to git, `.env` is not (for security)
- The application only reads from `.env` file

## Verification

When you start the server, check the logs:
- It should show: `SMTP_USER: viniketpawar007@gmail.com` (from `.env`)
- It should NOT show: `yadnyavalkyakd.a04@gmail.com` (from `.env.example`)
