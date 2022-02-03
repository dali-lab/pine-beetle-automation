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
    default: null,
    type: String,
  },
  federalNameOlder: { // older name of federal land historically used for SPB trapping, stored only to be available for download
    default: null,
    type: String,
  },
  year: { // year number
    type: Number,
  },
  hasSPBTrapping: { // indicator: did SPB trapping occur in this year/state/county? (spbCount & spbPer2Weeks != null)
    default: null,
    max: 1,
    min: 0,
    type: Number,
  },
  isValidForPrediction: { // indicator: can we generate predictions for this year/state/county? (hasSPBTrapping == 1, spotst1 & spotst2 != null)
    default: null,
    max: 1,
    min: 0,
    type: Number,
  },
  hasSpotst0: { // indicator: did spots get counted in this year/state/county? (spotst0 != null)
    default: null,
    max: 1,
    min: 0,
    type: Number,
  },
  hasPredictionAndOutcome: { // indicator: are there predictions & spot data for this year/state/county? (isValidForPrediction == 1, hasSpotst0 == 1)
    default: null,
    max: 1,
    min: 0,
    type: Number,
  },
  endobrev: { // indicator: was endobrev used for trapping, this is used as index to keep locations separate where some traps had endobrev and others didn't
    default: null,
    max: 1,
    min: 0,
    type: Number,
  },
  totalTrappingDays: { // number of trapping days
    default: null,
    min: 1,
    type: Number,
  },
  trapCount: { // number of traps
    default: null,
    min: 1,
    type: Number,
  },
  daysPerTrap: { // avg number of days per trap (totalTrappingDays / trapCount)
    default: null,
    type: Number,
  },
  spbCount: { // sum of all SPB across all traps in this year/state/county
    default: null,
    min: 0,
    type: Number,
  },
  spbPer2Weeks: { // number of SPB collected per trap per 14 days (spbCount / totalTrappingDays * 14)
    default: null,
    min: 0,
    type: Number,
  },
  spbPer2WeeksOrig: { // same as spbPer2Weeks for 2021 data & beyond, old field before endobrev normalization (see Matt Ayres), stored only to be available for download
    default: null,
    min: 0,
    type: Number,
  },
  spbPerDay: { // object mapping trap name to number of SPB it trapped, used for frontend visualizations
    // { trapName: Number ...  }
    default: null,
    type: Object,
  },
  cleridsPer2Weeks: { // number  of clerids collected per trap per 14 days (cleridCount / totalTrappingDays * 14)
    default: null,
    min: 0,
    type: Number,
  },
  cleridPerDay: { // object mapping trap name to number of clerids it trapped, used for frontend visualizations
    // { trapName: Number ...  }
    default: null,
    type: Object,
  },
  cleridst1: { // cleridsPer2Weeks in this state/county in year - 1
    default: null,
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
    default: null,
    type: Number,
  },
  mu: { // model output: parameter estimated by model
    default: null,
    type: Number,
  },
  expSpotsIfOutbreak: { // model output: expected number of spots if there is an outbreak (outbreak defined as any spots)
    default: null,
    type: Number,
  },
  probSpotsGT0: { // model output: probability of >0 spots in year/state/county
    default: null,
    type: Number,
  },
  probSpotsGT20: { // model output: probability of >20 spots in year/state/county
    default: null,
    type: Number,
  },
  probSpotsGT50: { // model output: probability of >50 spots in year/state/county
    default: null,
    type: Number,
  },
  probSpotsGT150: { // model output: probability of >150 spots in year/state/county
    default: null,
    type: Number,
  },
  probSpotsGT400: { // model output: probability of >400 spots in year/state/county
    default: null,
    type: Number,
  },
  probSpotsGT1000: { // model output: probability of >1000 spots in year/state/county
    default: null,
    type: Number,
  },
  'ln(spbPer2Weeks+1)': { // model output: natural logarithm of (spbPer2Weeks + 1), used for averaging trap captures across locations or years
    default: null,
    type: Number,
  },
  'ln(cleridsPer2Weeks+1)': { // model output: natural logarithm of (cleridsPer2Weeks + 1), used for averaging trap captures across locations or years
    default: null,
    type: Number,
  },
  'ln(spotst0+1)': { // model output: natural logarithm of (spotst0 + 1), used for averaging trap captures across locations or years
    default: null,
    type: Number,
  },
  'logit(Prob>50)': { // model output: logit transformation of probSpotsGT50, used for averaging of predicted probabilities across locations or years
    default: null,
    type: Number,
  },
  predSpotslogUnits: { // model output: predicted number of spots in units of natural logarithm
    default: null,
    type: Number,
  },
  predSpotsorigUnits: { // model output: back-transformation of predicted spots (e^(pred.Spots.logUnits) - 1)
    default: null,
    type: Number,
  },
  residualSpotslogUnits: { // model output: difference between observed and predicted number of spots (ln(spotst0 + 1) - pred.Spots.logUnits)
    default: null,
    type: Number,
  },
});

// compound index of year -> state -> rangerDistrict -> endobrev
SummarizedRangerDistrictSchema.index({
  year: 1,
  state: 1,
  rangerDistrict: 1,
  endobrev: 1,
}, { unique: true });

const SummarizedRangerDistrictModel = mongoose.model('SummarizedRangerDistrict', SummarizedRangerDistrictSchema);

export default SummarizedRangerDistrictModel;
