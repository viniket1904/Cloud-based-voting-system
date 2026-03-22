const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Election = require('../models/Election');
const Party = require('../models/Party');
const User = require('../models/User');
const Vote = require('../models/Vote');
const Notification = require('../models/Notification');
const { auth, adminOnly } = require('../middleware/auth');
const { 
  sendElectionActiveNotification, 
  sendElectionEndedNotification, 
  sendResultsDeclaredNotification 
} = require('../services/email');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

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

router.get('/', async (req, res) => {
  const status = req.query.status;
  const query = status ? { status } : {};
  const elections = await Election.find(query).sort({ createdAt: -1 });
  const rows = elections.map((e) => ({
    id: e.id,
    name: e.name,
    description: e.description,
    start_date: e.start_date,
    end_date: e.end_date,
    status: e.status,
    results_declared: e.results_declared || false,
    created_at: e.createdAt || e.created_at,
  }));
  return res.json(rows);
});

router.get('/:id/results', async (req, res) => {
  const e = await Election.findById(req.params.id);
  if (!e) return res.status(404).json({ error: 'Election not found' });
  let isAdmin = false;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const decoded = jwt.verify(authHeader.replace('Bearer ', ''), JWT_SECRET);
      isAdmin = !!decoded.is_admin;
    } catch (err) {}
  }
  if (!e.results_declared && !isAdmin) {
    return res.status(403).json({ error: 'Results are not declared yet for this election.' });
  }
  const results = await Vote.getResults(req.params.id);
  const total_votes = results.reduce((s, p) => s + p.vote_count, 0);
  return res.json({
    election_id: e.id,
    election_name: e.name,
    parties: results,
    total_votes,
  });
});

router.get('/:id', async (req, res) => {
  const e = await Election.findById(req.params.id);
  if (!e) return res.status(404).json({ error: 'Election not found' });
  const parties = await Party.find({ election_id: req.params.id }).sort({ createdAt: 1 });
  return res.json({
    id: e.id,
    name: e.name,
    description: e.description,
    start_date: e.start_date,
    end_date: e.end_date,
    status: e.status,
    results_declared: !!e.results_declared,
    created_at: e.createdAt || e.created_at,
    parties: parties.map(p => ({ id: p.id, name: p.name, symbol: p.symbol })),
  });
});

router.post('/', auth, adminOnly, async (req, res) => {
  const { name, description, start_date, end_date } = req.body;
  if (!name || !start_date || !end_date) {
    return res.status(400).json({ error: 'name, start_date and end_date are required' });
  }
  const userId = getUserIdForQuery(req.user.id);
  if (!userId) {
    return res.status(401).json({ error: 'Invalid authentication token. Please log in again.' });
  }
  try {
    const election = await Election.create({
      name: name.trim(),
      description: description?.trim() || null,
      start_date,
      end_date,
      status: 'draft',
      created_by: userId,
    });
    const doc = election.toJSON();
    return res.status(201).json(doc);
  } catch (err) {
    console.error('Failed to create election:', err);
    return res.status(500).json({ error: 'Failed to create election' });
  }
});

router.patch('/:id', auth, adminOnly, async (req, res) => {
  const { name, description, start_date, end_date, status, results_declared } = req.body;
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (start_date !== undefined) updateData.start_date = start_date;
  if (end_date !== undefined) updateData.end_date = end_date;
  if (status !== undefined && ['draft', 'active', 'ended'].includes(status)) updateData.status = status;
  if (results_declared !== undefined) updateData.results_declared = !!results_declared;
  
  const doc = await Election.findByIdAndUpdate(req.params.id, updateData, { new: true });
  if (!doc) return res.status(404).json({ error: 'Election not found' });
  return res.json(doc.toJSON());
});

router.post('/:id/parties', auth, adminOnly, async (req, res) => {
  const { name, symbol } = req.body;
  if (!name) return res.status(400).json({ error: 'Party name is required' });
  const e = await Election.findById(req.params.id);
  if (!e) return res.status(404).json({ error: 'Election not found' });
  try {
    const party = await Party.create({
      election_id: req.params.id,
      name: name.trim(),
      symbol: symbol?.trim() || null,
    });
    const doc = party.toJSON();
    return res.status(201).json(doc);
  } catch (err) {
    console.error('Failed to add party:', err);
    return res.status(500).json({ error: 'Failed to add party' });
  }
});

router.post('/:id/notify', auth, adminOnly, async (req, res) => {
  const election = await Election.findById(req.params.id);
  if (!election) return res.status(404).json({ error: 'Election not found' });
  
  // Get all voters (non-admin users)
  const voters = await User.find({ is_admin: false }).select('email name id');
  
  const results = {
    total: voters.length,
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };
  
  console.log(`Starting email notification for election ${election.id} (status: ${election.status}, results_declared: ${election.results_declared}) to ${voters.length} voters`);
  
  // Determine notification type based on election status
  let notificationType = 'active';
  if (election.results_declared) {
    notificationType = 'results';
  } else if (election.status === 'ended') {
    notificationType = 'ended';
  } else if (election.status === 'active') {
    notificationType = 'active';
  }
  
  console.log(`📧 Notification type: ${notificationType}`);
  
  // Get results if needed for results notification
  let electionResults = null;
  if (notificationType === 'results') {
    electionResults = await Vote.getResults(election._id);
    console.log(`📊 Election results: ${JSON.stringify(electionResults)}`);
  }
  
  // Check if force re-notification is requested (via query param)
  const forceRenotify = req.query.force === 'true';
  
  // Send emails to all voters
  for (const voter of voters) {
    try {
      // Check if already notified for this notification type (only skip if not forcing)
      if (!forceRenotify) {
        const existing = await Notification.findOne({ 
          election_id: election._id, 
          user_id: voter._id 
        });
        
        if (existing) {
          results.skipped++;
          console.log(`Skipping ${voter.email} - already notified`);
          continue;
        }
      } else {
        // If forcing, delete existing notification record first
        const existing = await Notification.findOne({ 
          election_id: election._id, 
          user_id: voter._id 
        });
        if (existing) {
          await Notification.findByIdAndDelete(existing._id);
          console.log(`Removed previous notification record for ${voter.email} (forcing re-notification)`);
        }
      }
      
      // Send appropriate email based on notification type
      let emailResult;
      if (notificationType === 'results') {
        emailResult = await sendResultsDeclaredNotification(
          voter.email,
          voter.name,
          election.name,
          electionResults
        );
      } else if (notificationType === 'ended') {
        emailResult = await sendElectionEndedNotification(
          voter.email,
          voter.name,
          election.name,
          election.start_date,
          election.end_date
        );
      } else {
        // active or default
        emailResult = await sendElectionActiveNotification(
          voter.email,
          voter.name,
          election.name,
          election.start_date,
          election.end_date
        );
      }
      
      if (emailResult.sent) {
        // Create notification record
        try {
          await Notification.create({
            election_id: election._id,
            user_id: voter._id
          });
        } catch (createErr) {
          // Ignore duplicate key errors - email was sent successfully
          if (createErr.code !== 11000) {
            throw createErr;
          }
        }
        results.sent++;
        console.log(`✅ ${notificationType.toUpperCase()} notification sent to ${voter.email}`);
      } else {
        results.failed++;
        results.errors.push({
          email: voter.email,
          reason: emailResult.reason || 'Unknown error'
        });
        console.log(`❌ Failed to send ${notificationType} notification to ${voter.email}: ${emailResult.reason}`);
      }
    } catch (err) {
      results.failed++;
      results.errors.push({
        email: voter.email,
        reason: err.message
      });
      console.error(`❌ Error sending ${notificationType} notification to ${voter.email}:`, err.message);
    }
  }
  
  const notificationTypeName = notificationType === 'results' ? 'results declared' : 
                                notificationType === 'ended' ? 'election ended' : 
                                'election active';
  
  console.log(`Email notification completed (${notificationTypeName}): ${results.sent} sent, ${results.failed} failed, ${results.skipped} skipped`);
  
  return res.json({
    message: `${notificationTypeName.charAt(0).toUpperCase() + notificationTypeName.slice(1)} notifications sent: ${results.sent} successful, ${results.failed} failed, ${results.skipped} already notified`,
    notification_type: notificationType,
    results: results
  });
});

router.get('/:id/my-vote', auth, async (req, res) => {
  const userId = getUserIdForQuery(req.user.id);
  if (!userId) {
    return res.status(401).json({ error: 'Invalid authentication token. Please log in again.' });
  }
  const v = await Vote.findOne({ election_id: req.params.id, user_id: userId });
  if (!v) return res.json({ voted: false });
  const party = await Party.findById(v.party_id);
  return res.json({
    voted: true,
    party_id: v.party_id,
    party: party ? { id: party.id, name: party.name, symbol: party.symbol } : null,
    created_at: v.createdAt || v.created_at,
  });
});

module.exports = router;
