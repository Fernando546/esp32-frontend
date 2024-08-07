import mongoose from 'mongoose';

const DataSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Data = mongoose.models.Data || mongoose.model('Data', DataSchema);

export default Data;
