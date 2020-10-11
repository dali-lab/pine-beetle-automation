/* eslint-disable sort-keys */
import mongoose, { Schema } from 'mongoose';
import numeral from 'numeral';

// use custom casting to better read unclean data
mongoose.SchemaTypes.Number.cast((v) => {
  if (v === null || v === '') return null; // explicitly allow null as a possible value

  const val = numeral(v).value(); // otherwise enforce numeral's extended casting
  if (val === null) throw new Error();
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
    type: Number, // unsure of this
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
    type: String,
  },
  sirexLure: {
    type: String, // unsure of this
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
  week: {
    max: 52,
    min: 1,
    type: Number,
  },
  year: {
    min: 1900,
    type: Number,
  },
});

// compound index of yr -> state -> rangerDistrict -> county -> trap -> week -> collectionDate
UnsummarizedTrappingSchema.index({
  year: 1,
  state: 1,
  rangerDistrict: 1,
  county: 1,
  trap: 1,
  week: 1,
  collectionDate: 1,
}, { unique: true });

const UnsummarizedTrappingModel = mongoose.model('UnsummarizedTrapping', UnsummarizedTrappingSchema);

export default UnsummarizedTrappingModel;
