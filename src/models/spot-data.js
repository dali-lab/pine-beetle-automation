/* eslint-disable sort-keys */
import mongoose, { Schema } from 'mongoose';

// collection 2: data on damaged trees that are collected in the fall
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
  spots: {
    default: null,
    min: 0,
    type: Number,
  },
  state: {
    type: String,
  },
  year: {
    min: 1900,
    type: Number,
  },
});

// compound index of yr -> state -> RD -> county
// to search by county, set RD = null in query
// to search by RD, ignore county
SpotDataSchema.index({
  year: 1,
  state: 1,
  rangerDistrict: 1,
  county: 1,
}, { unique: true });

const SpotDataModel = mongoose.model('SpotData', SpotDataSchema);

export default SpotDataModel;
