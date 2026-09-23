import mongoose from 'mongoose';

const pillarSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  tagline: { type: String, required: true },
  description: { type: String, required: true },
  officialUrl: { type: String, required: true },
  colorHex: { type: String, required: true }
}, { versionKey: false, timestamps: false });

export default mongoose.models.Pillar || mongoose.model('Pillar', pillarSchema);
