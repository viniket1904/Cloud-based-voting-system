const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true },
    name: { type: String, required: true },
    voter_id: { type: String, required: true, unique: true },
    aadhar_no: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    is_admin: { type: Boolean, default: false },

    // ✅ important fix
    face_descriptor: { type: [Number], required: true },

    selfie_image: { type: String, default: null },
  },
  { timestamps: true }
);

userSchema.virtual('id').get(function () {
  return this._id.toString();
});
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
