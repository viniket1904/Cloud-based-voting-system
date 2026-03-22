const mongoose = require('mongoose');
const User = require('../models/User');

async function initDb() {
  // Create default admin if none exists
  const adminCount = await User.countDocuments({ is_admin: true });
  if (adminCount === 0) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    // Create a dummy face descriptor for admin (128 zeros - admin won't use face verification)
    const dummyFaceDescriptor = new Array(128).fill(0);
    await User.create({
      email: 'admin@voting.gov',
      mobile: '0000000000',
      name: 'Voting Commission Admin',
      voter_id: 'ADMIN001',
      aadhar_no: '000000000000',
      password_hash: hash,
      is_admin: true,
      face_descriptor: dummyFaceDescriptor,
      selfie_image: null
    });
    console.log('Default admin created: admin@voting.gov / admin123');
  }
}

module.exports = { initDb };
