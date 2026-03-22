const mongoose = require('mongoose');

const partySchema = new mongoose.Schema(
  {
    election_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
    name: { type: String, required: true },
    symbol: { type: String, default: null },
  },
  { timestamps: true }
);

partySchema.virtual('id').get(function () {
  return this._id.toString();
});
partySchema.set('toJSON', { virtuals: true });
partySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Party', partySchema);
