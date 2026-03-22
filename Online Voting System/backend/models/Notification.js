const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    election_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

notificationSchema.index({ election_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('Notification', notificationSchema);
