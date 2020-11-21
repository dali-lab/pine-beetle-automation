/* eslint-disable sort-keys */
import mongoose, { Schema } from 'mongoose';

// collection 2: data on damaged trees that are collected in the fall -- only ranger districts
const SpotDataRangerDistrictSchema = new Schema({
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

// compound index of yr -> state -> RD
SpotDataRangerDistrictSchema.index({
  year: 1,
  state: 1,
  rangerDistrict: 1,
}, { unique: true });

const SpotDataRangerDistrictModel = mongoose.model('SpotDataRangerDistrict', SpotDataRangerDistrictSchema);

export default SpotDataRangerDistrictModel;
