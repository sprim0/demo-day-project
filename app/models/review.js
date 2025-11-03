var mongoose = require('mongoose');

var ReviewSchema = new mongoose.Schema({
  curriculum: { type: mongoose.Schema.Types.ObjectId, ref: 'Curriculum', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' }
}, { timestamps: true });

ReviewSchema.index({ curriculum: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);


