const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    election_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    party_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', required: true },
  },
  { timestamps: true }
);

voteSchema.index({ election_id: 1, user_id: 1 }, { unique: true });

voteSchema.virtual('id').get(function () {
  return this._id.toString();
});
voteSchema.set('toJSON', { virtuals: true });
voteSchema.set('toObject', { virtuals: true });

// Static method to get election results
voteSchema.statics.getResults = async function(electionId) {
  const Party = mongoose.model('Party');
  const parties = await Party.find({ election_id: electionId });
  
  const results = await Promise.all(
    parties.map(async (party) => {
      const voteCount = await this.countDocuments({ 
        election_id: electionId, 
        party_id: party._id 
      });
      return {
        id: party.id,
        name: party.name,
        symbol: party.symbol,
        vote_count: voteCount
      };
    })
  );
  
  return results.sort((a, b) => b.vote_count - a.vote_count);
};

module.exports = mongoose.model('Vote', voteSchema);
