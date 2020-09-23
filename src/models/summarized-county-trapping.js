import mongoose, { Schema } from 'mongoose';

// collection 3: county-level trapping data aggregated by year
const SummarizedCountyTrappingSchema = new Schema({
  state: { type: String },
  county: { type: String },
  year: {
    type: Number,
    min: 1900,
    index: true, // speeds up join w/ spots by year
  },
  spbCount: {
    type: Number,
    min: 0,
  },
  cleridCount: {
    type: Number,
    min: 0,
  },
});

const SummarizedCountyTrappingModel = mongoose.model('SummarizedCountyTrapping', SummarizedCountyTrappingSchema);

export default SummarizedCountyTrappingModel;
