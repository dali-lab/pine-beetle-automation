/* eslint-disable sort-keys */
import mongoose, { Schema } from 'mongoose';

// collection 2: data on damaged trees that are collected in the fall -- only counties
const SpotDataCountySchema = new Schema({
  county: {
    type: String,
  },
  fips: {
    type: Number,
  },
  hostAc: {
    type: Number,
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

// compound index of yr -> state -> county
SpotDataCountySchema.index({
  year: 1,
  state: 1,
  county: 1,
}, { unique: true });

const SpotDataCountyModel = mongoose.model('SpotDataCounty', SpotDataCountySchema);

export default SpotDataCountyModel;
