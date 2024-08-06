import mongoose from 'mongoose';

const DataSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
}, { timestamps: true });

export default mongoose.models.Data || mongoose.model('Data', DataSchema);
