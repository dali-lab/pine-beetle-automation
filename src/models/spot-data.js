import mongoose, { Schema } from 'mongoose';

// collection 2: data on damaged trees that are collected in the fall
// multiple indexing on Y to support aggregating individual annual sp data
const SpotDataSchema = new Schema({
  county: {
    type: String,
  },
  fips: {
    type: Number,
  },
  hostAc: {
    type: Number,
  },
  rangerDistrict: {
    type: String,
  },
  spbCount: {
    min: 0,
    type: Number,
  },
  state: {
    type: String,
  },
  year: {
    index: true,
    min: 1900,
    type: Number,
  },
});

const SpotDataModel = mongoose.model('SpotData', SpotDataSchema);

export default SpotDataModel;
