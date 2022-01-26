/* eslint-disable sort-keys */
import mongoose, { Schema } from 'mongoose';

// rangerdistrict-level summarized data aggregated by year
const SummarizedRangerDistrictSchema = new Schema({
  state: { // state abbreviation
    type: String,
  },
  rangerDistrict: { // ranger district name
    type: String,
  },
  federalNameOld: { // name of federal land historically used for SPB trapping, stored only to be available for download
    type: String,
  },
  federalNameOlder: { // older name of federal land historically used for SPB trapping, stored only to be available for download
    type: String,
  },
  year: { // year number
    type: Number,
  },
  hasSPBTrapping: { // indicator: did SPB trapping occur in this year/state/county? (spbCount & spbPer2Weeks != null)
    max: 1,
    min: 0,
    type: Number,
  },
  isValidForPrediction: { // indicator: can we generate predictions for this year/state/county? (hasSPBTrapping == 1, spotst1 & spotst2 != null)
    max: 1,
    min: 0,
    type: Number,
  },
  hasSpotst0: { // indicator: did spots get counted in this year/state/county? (spotst0 != null)
    max: 1,
    min: 0,
    type: Number,
  },
  hasPredictionAndOutcome: { // indicator: are there predictions & spot data for this year/state/county? (isValidForPrediction == 1, hasSpotst0 == 1)
    max: 1,
    min: 0,
    type: Number,
  },
  endobrev: { // indicator: was endobrev used for trapping, this is used as index to keep locations separate where some traps had endobrev and others didn't
    max: 1,
    min: 0,
    type: Number,
  },
  totalTrappingDays: { // number of trapping days
    min: 1,
    type: Number,
  },
  trapCount: { // number of traps
    min: 1,
    type: Number,
  },
  daysPerTrap: { // avg number of days per trap (totalTrappingDays / trapCount)
    type: Number,
  },
  spbCount: { // sum of all SPB across all traps in this year/state/county
    min: 0,
    type: Number,
  },
  spbPer2Weeks: { // number of SPB collected per trap per 14 days (spbCount / totalTrappingDays * 14)
    min: 0,
    type: Number,
  },
  spbPer2WeeksOrig: { // same as spbPer2Weeks for 2021 data & beyond, old field before endobrev normalization (see Matt Ayres), stored only to be available for download
    min: 0,
    type: Number,
  },
  spbPerDay: { // object mapping trap name to number of SPB it trapped, used for frontend visualizations
    // { trapName: Number ...  }
    type: Object,
  },
  cleridCount: { // sum of all clerid across all traps in this year/state/county
    min: 0,
    type: Number,
  },
  cleridPer2Weeks: { // number  of clerids collected per trap per 14 days (cleridCount / totalTrappingDays * 14)
    min: 0,
    type: Number,
  },
  cleridPerDay: { // object mapping trap name to number of clerids it trapped, used for frontend visualizations
    // { trapName: Number ...  }
    type: Object,
  },
  cleridst1: { // cleridsPerDay in this state/county in year - 1
    min: 0,
    type: Number,
  },
  spotst0: { // number of local infestations of SPB ("spots") in state/county this year
    default: null,
    min: 0,
    type: Number,
  },
  spotst1: { // number of local infestations of SPB ("spots") in state/county in year - 1
    default: null,
    min: 0,
    type: Number,
  },
  spotst2: { // number of local infestations of SPB ("spots") in state/county in year - 2
    default: null,
    min: 0,
    type: Number,
  },
  pi: { // model output: parameter estimated by model

  },
  mu: { // model output: parameter estimated by model

  },
  expSpotsIfOutbreak: { // model output: expected number of spots if there is an outbreak (outbreak defined as any spots)

  },
  probSpotsGT0: { // model output: probability of >0 spots in year/state/county

  },
  probSpotsGT20: { // model output: probability of >20 spots in year/state/county

  },
  probSpotsGT50: { // model output: probability of >50 spots in year/state/county

  },
  probSpotsGT150: { // model output: probability of >150 spots in year/state/county

  },
  probSpotsGT400: { // model output: probability of >400 spots in year/state/county

  },
  probSpotsGT1000: { // model output: probability of >1000 spots in year/state/county

  },
  'ln(spbPer2Weeks+1)': { // model output: natural logarithm of (spbPer2Weeks + 1), used for averaging trap captures across locations or years
    type: Number,
  },
  'ln(cleridsPer2Weeks+1)': { // model output: natural logarithm of (cleridsPer2Weeks + 1), used for averaging trap captures across locations or years
    type: Number,
  },
  'ln(spotst0+1)': { // model output: natural logarithm of (spotst0 + 1), used for averaging trap captures across locations or years
    type: Number,
  },
  'logit(Prob>50)': { // model output: logit transformation of probSpotsGT50, used for averaging of predicted probabilities across locations or years
    type: Number,
  },
  'pred.Spots.logUnits': { // model output: predicted number of spots in units of natural logarithm
    type: Number,
  },
  'pred.Spots.origUnits': { // model output: back-transformation of predicted spots (e^(pred.Spots.logUnits) - 1)
    type: Number,
  },
  'residualSpots.logUnits': { // model output: difference between observed and predicted number of spots (ln(spotst0 + 1) - pred.Spots.logUnits)
    type: Number,
  },
});

// compound index of year -> state -> rangerDistrict -> endobrev
SummarizedRangerDistrictSchema.index({
  year: 1,
  state: 1,
  county: 1,
  endobrev: 1,
}, { unique: true });

const SummarizedRangerDistrictModel = mongoose.model('SummarizedRangerDistrict', SummarizedRangerDistrictSchema);

export default SummarizedRangerDistrictModel;
