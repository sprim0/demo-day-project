var mongoose = require('mongoose');

var CurriculumSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  gradeLevel: { type: String, default: '' },
  subjects: { type: [String], index: true, default: [] },
  interests: { type: [String], index: true, default: [] },
  format: { type: String, enum: ['video', 'pdf', 'live', 'self-paced', 'website', 'app', 'book', 'mixed', 'other'], default: 'other' },
  providerName: { type: String, default: '' },
  externalUrl: { type: String, default: '' },
  cost: { type: String, enum: ['free', 'paid'], default: 'free' },
  price: { type: Number, default: 0 },
  imageUrl: { type: String, default: '' },
  timeCommitment: { type: String, default: '' },
  language: { type: String, default: 'English' },
  faithBased: { type: Boolean, default: false },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  ratingsCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Curriculum', CurriculumSchema);


