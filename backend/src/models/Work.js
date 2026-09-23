import mongoose from 'mongoose';

const workSchema = new mongoose.Schema({
  title: { type: String, required: true },
  pillar: { type: String, required: true, index: true },
  category: { type: String, required: true, index: true },
  year: { type: Number, required: true, index: true },
  description: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  sourceType: { type: String, enum: ['official', 'illustrative'], default: 'official', required: true },
  sourceUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

workSchema.index({ title: 'text', description: 'text' });

export default mongoose.models.Work || mongoose.model('Work', workSchema);
