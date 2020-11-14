/* eslint-disable sort-keys */
import mongoose, { Schema } from 'mongoose';
import numeral from 'numeral';

// use custom casting to better read unclean data
mongoose.SchemaTypes.Number.cast((v) => {
  if (v === null) return null; // explicitly allow null as a possible value

  if (v === '') return 0; // blank is zero

  const val = numeral(v).value(); // otherwise enforce numeral's extended casting
  if (val === null) throw new Error(); // null will be thrown on cast error
  return val;
});

// custom cast to turn empty strings into null
const stringcast = mongoose.SchemaTypes.String.cast();
mongoose.SchemaTypes.String.cast((v) => {
  if (!v) return null;
  return stringcast(v);
});

// collection 1: historical unsummarized trapping
const UnsummarizedTrappingSchema = new Schema({
  bloom: {
    type: String,
  },
  bloomDate: {
    type: Date,
  },
  cleridCount: {
    min: 0,
    type: Number,
  },
  collectionDate: {
    type: Date,
  },
  county: {
    type: String,
  },
  daysActive: {
    type: Number,
  },
  endobrev: {
    default: 1,
    max: 1,
    min: 0,
    type: Number,
  },
  fips: {
    type: Number,
  },
  latitude: {
    max: 90,
    min: -90,
    type: Number,
  },
  longitude: {
    max: 180,
    min: -180,
    type: Number,
  },
  lure: {
    type: String,
  },
  rangerDistrict: {
    type: String,
  },
  season: {
    lowercase: true,
    type: String,
  },
  sirexLure: {
    type: String,
  },
  spbCount: {
    min: 0,
    type: Number,
  },
  startDate: {
    type: Date,
  },
  state: {
    type: String,
  },
  trap: {
    type: String,
  },
  year: {
    min: 1900,
    type: Number,
  },
});

// compound index of yr -> state -> rangerDistrict -> county -> trap
UnsummarizedTrappingSchema.index({
  year: 1,
  state: 1,
  rangerDistrict: 1,
  county: 1,
  trap: 1,
}, { unique: false });

const UnsummarizedTrappingModel = mongoose.model('UnsummarizedTrapping', UnsummarizedTrappingSchema);

export default UnsummarizedTrappingModel;
