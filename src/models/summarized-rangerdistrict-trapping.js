import mongoose, { Schema } from 'mongoose';

// collection 4: rangerdistrict-level trapping data aggregated by year
const SummarizedRangerDistrictTrappingSchema = new Schema({
  state: { type: String },
  rangerDistrict: { type: String },
  year: {
    type: Number,
    min: 1900,
    max: 2022,
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

const SummarizedRangerDistrictTrappingModel = mongoose.model('SummarizedCountyTrapping', SummarizedRangerDistrictTrappingSchema);

export default SummarizedRangerDistrictTrappingModel;
