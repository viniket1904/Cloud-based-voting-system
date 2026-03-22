const dns = require('dns');
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/voting';
const MONGODB_URI_STANDARD = process.env.MONGODB_URI_STANDARD; // optional fallback when SRV fails (e.g. DNS/firewall on some machines)

async function connectDB() {
  const urisToTry = [MONGODB_URI];
  if (MONGODB_URI_STANDARD) urisToTry.push(MONGODB_URI_STANDARD);

  for (let i = 0; i < urisToTry.length; i++) {
    const uri = urisToTry[i];
    const isFirstTry = i === 0;
    try {
      if (isFirstTry && uri.startsWith('mongodb+srv://')) {
        try {
          dns.setServers(['8.8.8.8', '8.8.4.4']);
        } catch (_) {}
      }
      await mongoose.connect(uri);
      console.log('MongoDB connected');
      return;
    } catch (err) {
      const isSrvFailure = /querySrv|ECONNREFUSED|ENOTFOUND/i.test(err.message);
      if (isSrvFailure && isFirstTry && urisToTry.length > 1) {
        console.warn('MongoDB SRV failed, trying standard URI...');
        continue;
      }
      if (isSrvFailure && isFirstTry && !MONGODB_URI_STANDARD) {
        console.warn('MongoDB SRV failed (often on mobile hotspot or restricted DNS). Add MONGODB_URI_STANDARD in .env - get it from Atlas: Connect → Drivers → "Connection string" or Compass.');
      }
      console.error('MongoDB connection error:', err.message);
      process.exit(1);
    }
  }
}

module.exports = { connectDB };
