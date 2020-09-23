import mongoose, { Schema } from 'mongoose';

// collection 4: rangerdistrict-level trapping data aggregated by year
// multiple indexing on state/county/year for index intersection
// speeds up merging w/ spot data, also speeds up client-side reading
const SummarizedRangerDistrictTrappingSchema = new Schema({
  state: {
    type: String,
    index: true,
  },
  rangerDistrict: {
    type: String,
    index: true,
  },
  year: {
    type: Number,
    min: 1900,
    index: true,
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

const SummarizedRangerDistrictTrappingModel = mongoose.model('SummarizedRangerDistrictTrapping', SummarizedRangerDistrictTrappingSchema);

export default SummarizedRangerDistrictTrappingModel;
