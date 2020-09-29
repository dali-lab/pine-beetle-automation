import mongoose, { Schema } from 'mongoose';

// collection 3: county-level trapping data aggregated by year
// multiple indexing on state/county/year for index intersection
// speeds up merging w/ spot data, also speeds up client-side reading
const SummarizedCountyTrappingSchema = new Schema({
  cleridCount: {
    min: 0,
    type: Number,
  },
  county: {
    index: true,
    type: String,
  },
  spbCount: {
    min: 0,
    type: Number,
  },
  state: {
    index: true,
    type: String,
  },
  year: {
    index: true,
    min: 1900,
    type: Number,
  },
});

const SummarizedCountyTrappingModel = mongoose.model('SummarizedCountyTrapping', SummarizedCountyTrappingSchema);

export default SummarizedCountyTrappingModel;
