import mongoose, { Schema } from 'mongoose';

// collection 4: rangerdistrict-level trapping data aggregated by year
// multiple indexing on state/county/year for index intersection
// speeds up merging w/ spot data, also speeds up client-side reading
const SummarizedRangerDistrictTrappingSchema = new Schema({
  cleridCount: {
    min: 0,
    type: Number,
  },
  rangerDistrict: {
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

const SummarizedRangerDistrictTrappingModel = mongoose.model('SummarizedRangerDistrictTrapping', SummarizedRangerDistrictTrappingSchema);

export default SummarizedRangerDistrictTrappingModel;
