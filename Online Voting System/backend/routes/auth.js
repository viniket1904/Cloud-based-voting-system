const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { auth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Helper function to safely convert user ID to MongoDB ObjectId
function getUserIdForQuery(userId) {
  // If it's already a string and looks like a valid ObjectId, use it
  if (typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)) {
    return userId;
  }
  // If it's a number (from old SQLite tokens), return null to indicate invalid
  if (typeof userId === 'number') {
    return null;
  }
  // Try to convert to string and validate
  const idStr = String(userId);
  return mongoose.Types.ObjectId.isValid(idStr) ? idStr : null;
}

// Rate limiting for face verification attempts
const faceVerificationAttempts = new Map();
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutes

function euclideanDistance(a, b) {
  // Strict validation: ensure both are arrays of exactly 128 numbers
  if (!Array.isArray(a) || !Array.isArray(b)) {
    console.log('Face descriptor validation failed: not arrays', { aType: typeof a, bType: typeof b });
    return Infinity;
  }
  if (a.length !== 128 || b.length !== 128) {
    console.log('Face descriptor validation failed: wrong length', { aLength: a.length, bLength: b.length });
    return Infinity;
  }
  
  // Ensure all elements are numbers
  for (let i = 0; i < 128; i++) {
    if (typeof a[i] !== 'number' || typeof b[i] !== 'number' || isNaN(a[i]) || isNaN(b[i])) {
      console.log('Face descriptor validation failed: invalid number at index', i);
      return Infinity;
    }
  }
  
  let sum = 0;
  for (let i = 0; i < 128; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

// Cosine similarity for additional verification
function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== 128 || b.length !== 128) {
    return -1; // Invalid
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < 128; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return -1;
  
  return dotProduct / denominator;
}

// VERY STRICT threshold: 0.4 ensures ONLY registered user's face passes
// Typical face-api.js distances: 
// - Same person: 0.2-0.4 (very close match, same person)
// - Different person: 0.6-1.2+ (clearly different person)
// Using 0.4 is VERY strict - only very close matches pass
const FACE_MATCH_THRESHOLD = 0.4;

// Cosine similarity threshold (higher = stricter, max is 1.0)
// Same person typically has cosine similarity > 0.90
// Using 0.90 ensures VERY high similarity match
const COSINE_SIMILARITY_THRESHOLD = 0.90;

router.post('/register', async (req, res) => {
  const { email, mobile, name, voter_id, aadhar_no, password, face_descriptor, selfie_image } = req.body;
  if (!email || !mobile || !name || !voter_id || !aadhar_no || !password) {
    return res.status(400).json({ error: 'All fields are required: email, mobile, name, voter_id, aadhar_no, password' });
  }
  if (!Array.isArray(face_descriptor) || face_descriptor.length !== 128) {
    return res.status(400).json({ error: 'A selfie with a clear face is required. Please capture your face at registration.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  // Validate Aadhar number (12 digits)
  const aadharStr = String(aadhar_no).replace(/\s/g, '');
  if (aadharStr.length !== 12 || !/^\d{12}$/.test(aadharStr)) {
    return res.status(400).json({ error: 'Aadhar number must be exactly 12 digits' });
  }
  
  // Validate mobile number (10 digits)
  const mobileStr = String(mobile).replace(/\s/g, '');
  if (mobileStr.length !== 10 || !/^\d{10}$/.test(mobileStr)) {
    return res.status(400).json({ error: 'Mobile number must be exactly 10 digits' });
  }
  
  // Validate voter ID (3 letters + 7 numbers)
  const voterIdStr = String(voter_id).trim().toUpperCase();
  if (!/^[A-Z]{3}\d{7}$/.test(voterIdStr)) {
    return res.status(400).json({ error: 'Voter ID must be 3 letters followed by 7 numbers (e.g., ABC1234567)' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const selfieData = typeof selfie_image === 'string' && selfie_image.length < 500000 ? selfie_image : null;
  try {
    const user = await User.create({
      email: email.trim(),
      mobile: mobileStr, // Use validated mobile string
      name: name.trim(),
      voter_id: voterIdStr, // Use validated voter ID (uppercase)
      aadhar_no: aadharStr, // Use validated aadhar string
      password_hash: hash,
      is_admin: false,
      face_descriptor,
      selfie_image: selfieData,
    });
    const safe = user.toJSON();
    const token = jwt.sign(
      { id: safe.id, email: safe.email, is_admin: safe.is_admin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.status(201).json({ message: 'Registration successful', user: safe, token });
  } catch (e) {
    if (e.code === 11000) {
      // MongoDB duplicate key error
      const field = Object.keys(e.keyPattern || {})[0];
      if (field === 'aadhar_no') return res.status(400).json({ error: 'An account with this Aadhar number already exists' });
      if (field === 'voter_id') return res.status(400).json({ error: 'An account with this Voter ID already exists' });
      if (field === 'email') return res.status(400).json({ error: 'An account with this email already exists' });
      return res.status(400).json({ error: 'An account with this information already exists' });
    }
    console.error('Registration error:', e);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const user = await User.findOne({ email: email.trim() });
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const safe = user.toJSON();
  const token = jwt.sign(
    { id: user.id, email: user.email, is_admin: user.is_admin },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  return res.json({ user: safe, token });
});

router.get('/me', auth, async (req, res) => {
  const userId = getUserIdForQuery(req.user.id);
  if (!userId) {
    return res.status(401).json({ error: 'Invalid authentication token. Please log in again.' });
  }
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json(user.toJSON());
});

function checkRateLimit(userId) {
  const now = Date.now();
  const attempts = faceVerificationAttempts.get(userId) || [];
  
  // Clean old attempts
  const validAttempts = attempts.filter(timestamp => now - timestamp < ATTEMPT_WINDOW);
  
  if (validAttempts.length >= MAX_ATTEMPTS) {
    return false; // Rate limited
  }
  
  // Add current attempt
  validAttempts.push(now);
  faceVerificationAttempts.set(userId, validAttempts);
  return true;
}

router.post('/verify-face', auth, async (req, res) => {
  const { descriptor } = req.body;
  
  // Strict validation of incoming descriptor
  if (!descriptor) {
    return res.status(400).json({ error: 'Face descriptor is required. Please capture your face.' });
  }
  
  if (!Array.isArray(descriptor)) {
    console.log('Invalid descriptor type:', typeof descriptor);
    return res.status(400).json({ error: 'Invalid face data format. Please try capturing again.' });
  }
  
  if (descriptor.length !== 128) {
    console.log('Invalid descriptor length:', descriptor.length);
    return res.status(400).json({ error: 'Face capture incomplete. Please ensure your face is clearly visible and try again.' });
  }
  
  // Validate all elements are numbers
  const hasInvalidNumbers = descriptor.some((val, idx) => {
    if (typeof val !== 'number' || isNaN(val)) {
      console.log(`Invalid number at index ${idx}:`, val, typeof val);
      return true;
    }
    return false;
  });
  
  if (hasInvalidNumbers) {
    return res.status(400).json({ error: 'Invalid face data detected. Please capture your face again.' });
  }
  
  // Rate limiting check
  const userId = getUserIdForQuery(req.user.id);
  if (!userId) {
    return res.status(401).json({ error: 'Invalid authentication token. Please log in again.' });
  }
  if (!checkRateLimit(userId)) {
    return res.status(429).json({ error: 'Too many verification attempts. Please try again in 5 minutes.' });
  }
  
  // Additional security: Ensure user has a registered face
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  if (!user.face_descriptor) {
    console.log(`User ${userId} has no registered face descriptor`);
    return res.status(403).json({ error: 'No face registered for this account. Please complete registration with face capture first.' });
  }
  
  // Ensure stored descriptor is valid
  if (!Array.isArray(user.face_descriptor) || user.face_descriptor.length !== 128) {
    console.log(`User ${userId} has invalid stored descriptor:`, {
      isArray: Array.isArray(user.face_descriptor),
      length: user.face_descriptor?.length
    });
    return res.status(500).json({ error: 'Registration data error. Please contact support.' });
  }
  
  // Compare face descriptors using MULTIPLE methods for maximum security
  const euclideanDist = euclideanDistance(user.face_descriptor, descriptor);
  const cosineSim = cosineSimilarity(user.face_descriptor, descriptor);
  
  if (euclideanDist === Infinity || cosineSim === -1) {
    console.log(`Face comparison failed - invalid descriptors for user ${user.email}`);
    return res.status(400).json({ error: 'Face comparison error. Please try capturing again.' });
  }
  
  // STRICT DUAL VERIFICATION: BOTH checks MUST pass - no exceptions
  // This ensures only the registered user's face can pass
  const euclideanPass = euclideanDist <= FACE_MATCH_THRESHOLD;
  const cosinePass = cosineSim >= COSINE_SIMILARITY_THRESHOLD;
  
  console.log(`Face verification attempt for user ${user.email} (${user.name}):`, {
    euclideanDistance: euclideanDist.toFixed(4),
    euclideanThreshold: FACE_MATCH_THRESHOLD,
    euclideanPass: euclideanPass,
    cosineSimilarity: cosineSim.toFixed(4),
    cosineThreshold: COSINE_SIMILARITY_THRESHOLD,
    cosinePass: cosinePass,
    overallPass: euclideanPass && cosinePass
  });
  
  // CRITICAL: BOTH checks must pass - this is non-negotiable for security
  if (!euclideanPass || !cosinePass) {
    const reasons = [];
    if (!euclideanPass) {
      reasons.push(`Euclidean distance ${euclideanDist.toFixed(3)} exceeds strict threshold ${FACE_MATCH_THRESHOLD} (must be ≤ ${FACE_MATCH_THRESHOLD})`);
    }
    if (!cosinePass) {
      reasons.push(`Cosine similarity ${cosineSim.toFixed(3)} below strict threshold ${COSINE_SIMILARITY_THRESHOLD} (must be ≥ ${COSINE_SIMILARITY_THRESHOLD})`);
    }
    
    console.log(`❌ Face verification FAILED for user ${user.email} (${user.name}) - Security check failed: ${reasons.join('; ')}`);
    return res.status(401).json({ 
      error: `Face verification FAILED: ${reasons.join('; ')}. Your face does not match your registration photo. Only the registered user's face can pass verification. Please ensure: 1) Good lighting, 2) Look directly at camera, 3) Remove glasses/masks if possible, 4) Use the same device/conditions as registration.` 
    });
  }
  
  // Only if BOTH checks pass
  console.log(`✅ Face verification SUCCESS for user ${user.email} (${user.name}) - Both checks passed: Euclidean ${euclideanDist.toFixed(4)} ≤ ${FACE_MATCH_THRESHOLD}, Cosine ${cosineSim.toFixed(4)} ≥ ${COSINE_SIMILARITY_THRESHOLD}`);
  
  // Clear successful attempts
  faceVerificationAttempts.delete(userId);
  
  // Generate face verification token with user ID embedded
  const faceToken = jwt.sign(
    { 
      purpose: 'face_verification', 
      userId: userId, 
      email: user.email, // Additional security: include email
      timestamp: Date.now() 
    },
    JWT_SECRET,
    { expiresIn: '3m' }
  );
  
  return res.json({ face_verification_token: faceToken });
});

module.exports = router;
