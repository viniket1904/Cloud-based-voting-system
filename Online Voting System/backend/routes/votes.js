const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Election = require('../models/Election');
const Party = require('../models/Party');
const Vote = require('../models/Vote');
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

function verifyFaceToken(faceToken, userId, userEmail) {
  if (!faceToken || typeof faceToken !== 'string') {
    console.log(`Face token missing or invalid type for user ${userId}`);
    return null;
  }
  
  try {
    const decoded = jwt.verify(faceToken, JWT_SECRET);
    
    // Strict validation: check purpose
    if (decoded.purpose !== 'face_verification') {
      console.log(`Face token has wrong purpose for user ${userId}: ${decoded.purpose}`);
      return null;
    }
    
    // Strict validation: check user ID matches
    if (decoded.userId !== userId) {
      console.log(`Face token user ID mismatch: token userId=${decoded.userId}, request userId=${userId}`);
      return null;
    }
    
    // Additional security: verify email matches (if present in token)
    if (decoded.email && userEmail && decoded.email !== userEmail) {
      console.log(`Face token email mismatch: token email=${decoded.email}, user email=${userEmail}`);
      return null;
    }
    
    // Additional security: Check token age (prevent replay attacks)
    const tokenAge = Date.now() - (decoded.timestamp || 0);
    if (tokenAge > 180000) { // 3 minutes in milliseconds
      console.log(`Face token EXPIRED for user ${userId} - age: ${tokenAge}ms`);
      return null;
    }
    
    // Additional security: reject tokens older than 3 minutes (even if JWT hasn't expired)
    if (tokenAge < 0) {
      console.log(`Face token has future timestamp for user ${userId}`);
      return null;
    }
    
    return decoded;
  } catch (e) {
    console.log(`Face token INVALID for user ${userId}: ${e.message}`);
    return null;
  }
}

router.post('/', auth, async (req, res) => {
  const { election_id, party_id, face_verification_token } = req.body;
  
  // Validate required fields
  if (!election_id || !party_id) {
    return res.status(400).json({ error: 'election_id and party_id are required' });
  }
  
  // Get user to verify email match
  const userId = getUserIdForQuery(req.user.id);
  if (!userId) {
    return res.status(401).json({ error: 'Invalid authentication token. Please log in again.' });
  }
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Strict face token verification
  if (!verifyFaceToken(face_verification_token, userId, user.email)) {
    console.log(`Vote REJECTED - Invalid or missing face token for user ${userId} (${user.email}) in election ${election_id}`);
    return res.status(401).json({ error: 'Face verification required and must be valid. Please verify your face before casting the vote.' });
  }
  
  console.log(`Face token verified successfully for user ${userId} (${user.email})`);

  const election = await Election.findById(election_id);
  if (!election) return res.status(404).json({ error: 'Election not found' });
  if (election.status !== 'active') {
    return res.status(400).json({ error: 'Voting is not open for this election' });
  }

  const party = await Party.findOne({ election_id, _id: party_id });
  if (!party) return res.status(404).json({ error: 'Party not found for this election' });

  const existing = await Vote.findOne({ election_id, user_id: userId });
  if (existing) {
    return res.status(400).json({ error: 'You have already cast your vote in this election. Only one vote per voter is allowed.' });
  }

  try {
    const vote = await Vote.create({
      election_id,
      user_id: userId,
      party_id,
    });
    console.log(`Vote CAST successfully - User ${userId} voted for party ${party_id} in election ${election_id}`);
    const doc = vote.toJSON();
    return res.status(201).json({ message: 'Vote cast successfully', vote: doc });
  } catch (e) {
    if (e.code === 11000) {
      // MongoDB duplicate key error (unique constraint on election_id + user_id)
      return res.status(400).json({ error: 'You have already cast your vote in this election.' });
    }
    console.error('Failed to cast vote:', e);
    return res.status(500).json({ error: 'Failed to cast vote' });
  }
});

module.exports = router;
