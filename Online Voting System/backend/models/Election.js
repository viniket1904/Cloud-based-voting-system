const mongoose = require('mongoose');

const electionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: null },
    start_date: { type: String, required: true },
    end_date: { type: String, required: true },
    status: { type: String, enum: ['draft', 'active', 'ended'], default: 'draft' },
    results_declared: { type: Boolean, default: false },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

electionSchema.virtual('id').get(function () {
  return this._id.toString();
});
electionSchema.set('toJSON', { virtuals: true });
electionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Election', electionSchema);
