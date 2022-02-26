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
  year: {
    min: 1900,
    type: Number,
  },
  state: {
    type: String,
  },
  county: {
    type: String,
  },
  rangerDistrict: {
    type: String,
  },
  FIPS: {
    type: Number,
  },
  season: {
    lowercase: true,
    type: String,
  },
  trap: {
    type: String,
  },
  endobrev: {
    default: 1,
    max: 1,
    min: 0,
    type: Number,
  },
  sirexLure: {
    type: String,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  collectionDate: {
    type: Date,
  },
  daysActive: {
    type: Number,
  },
  spbCount: {
    min: 0,
    type: Number,
  },
  cleridCount: {
    min: 0,
    type: Number,
  },
  bloom: {
    type: String,
  },
  bloomDate: {
    type: Date,
  },
  globalID: {
    type: String,
    index: true,
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
