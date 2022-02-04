const ROUND_EPSILON = 0.0000001;

/* eslint-disable new-cap */
/* eslint-disable import/prefer-default-export */
/**
 * @description creates a custom aggregation pipeline for either county or RD
 * @param {String} location either 'county' or 'rangerDistrict'
 * @param {String} collection either 'summarizedcounties' or 'summarizedrangerdistricts'
 * @param {Object} [filter] optional filter to subset data
 * @returns {Array<Object>} that should be used as ... to input into aggregate
 */
export const trappingAggregationPipelineCreator = (location, collection, filter) => [
  // use provided filter
  ...(filter ? [{ $match: filter }] : {}),
  // only aggregate spring data
  {
    $match: { season: 'spring' },
  },
  // filter out docs that are recorded on the other geographical organization
  // (RD for county, county for RD)
  {
    $match: { [location]: { $ne: null } },
  },
  // select total days, beetles per trap, group by trap in year
  {
    $group: {
      _id: {
        endobrev: '$endobrev',
        [location]: `$${location}`,
        state: '$state',
        trap: '$trap',
        year: '$year',
      },
      cleridCount: { $sum: '$cleridCount' },
      spbCount: { $sum: '$spbCount' },
      totalDaysActive: { $sum: '$daysActive' },
      ...(location === 'county' ? { FIPS: { $first: '$FIPS' } } : {}),
    },
  },
  // select beetle counts, trap count, total trapping days, beetles per day per trap, group by county/RD in year
  // calculate average beetles per trap (unweighted)
  {
    $group: {
      _id: {
        endobrev: '$_id.endobrev',
        [location]: `$_id.${location}`,
        state: '$_id.state',
        year: '$_id.year',
      },
      cleridAvg: { $avg: { $divide: ['$cleridCount', '$totalDaysActive'] } },
      cleridCount: { $sum: '$cleridCount' },
      cleridPerDay: { // this creates an array, which is casted during project to object
        $push: {
          k: '$_id.trap',
          v: { $divide: ['$cleridCount', '$totalDaysActive'] },
        },
      },
      spbAvg: { $avg: { $divide: ['$spbCount', '$totalDaysActive'] } },
      spbCount: { $sum: '$spbCount' },
      spbPerDay: { // this creates an array, which is casted during project to object
        $push: {
          k: '$_id.trap',
          v: { $divide: ['$spbCount', '$totalDaysActive'] },
        },
      },
      totalTrappingDays: { $sum: '$totalDaysActive' },
      trapCount: { $sum: 1 },
      ...(location === 'county' ? { FIPS: { $first: '$FIPS' } } : {}),
    },
  },
  // reformat the data, remove messy _id and allow mongo to regenerate it, reduce arrays to objects
  {
    $project: {
      _id: 0,
      cleridsPer2Weeks: { $round: [{ $add: [{ $multiply: [14, '$cleridAvg'] }, ROUND_EPSILON] }] },
      cleridPerDay: { // cast k,v array to object
        $arrayToObject: '$cleridPerDay',
      },
      daysPerTrap: { $round: [{ $add: [{ $divide: ['$totalTrappingDays', '$trapCount'] }, ROUND_EPSILON] }] },
      endobrev: '$_id.endobrev',
      [location]: `$_id.${location}`,
      spbCount: 1,
      spbPer2Weeks: {
        $cond: {
          if: { $eq: ['$_id.endobrev', 1] },
          then: { $round: [{ $add: [{ $multiply: [14, '$spbAvg'] }, ROUND_EPSILON] }] },
          else: { $round: [{ $add: [{ $multiply: [{ $multiply: [14, '$spbAvg'] }, 10] }, ROUND_EPSILON] }] },
        },
      },
      spbPer2WeeksOrig: { $round: [{ $add: [{ $multiply: [14, '$spbAvg'] }, ROUND_EPSILON] }] },
      spbPerDay: { // cast k,v array to object
        $arrayToObject: '$spbPerDay',
      },
      state: '$_id.state',
      totalTrappingDays: 1,
      trapCount: 1,
      year: '$_id.year',
      ...(location === 'county' ? { FIPS: 1 } : {}),
      ...(location === 'rangerDistrict' ? {
        federalNameOld: { $literal: null },
        federalNameOlder: { $literal: null },
      } : {}),
    },
  },
  // output and merge into collection
  {
    $merge: {
      into: collection,
      on: ['year', 'state', location, 'endobrev'],
      whenMatched: 'merge',
    },
  },
];

/**
 * @description builds pipeline to append prior year spot data
 * @param {String} location the geographic grouping county/rd to work on
 * @param {String} outputCollection the collection to append to
 * @param {Object} [filter] optional filter to subset data
 * @param {Number} endobrev value for endobrev
 */
const t1 = (location, outputCollection, filter, endobrev) => [
  // filter out nulls
  {
    $match: {
      year: { $ne: 0 },
      state: { $ne: null },
      [location]: { $ne: null },
    },
  },
  // user-passed filter
  ...(filter ? [{ $match: filter }] : {}),
  // fit the shape of data to only update spots
  {
    $project: {
      _id: 0,
      endobrev: { $literal: endobrev },
      spotst1: '$spotst0', // rename
      cleridst1: '$cleridsPer2Weeks', // rename
      state: 1,
      year: { $sum: ['$year', 1] }, // lookahead of one year
      [location]: 1,
    },
  },
  {
    $merge: {
      into: outputCollection,
      on: ['year', 'state', location, 'endobrev'],
      whenMatched: 'merge',
      whenNotMatched: 'discard',
    },
  },
];

/**
 * @description builds pipeline to append 2 year ago spot data
 * @param {String} location the geographic grouping county/rd to work on
 * @param {String} outputCollection the collection to append to
 * @param {Object} [filter] optional filter to subset data
 * @param {Number} endobrev value for endobrev
 */
const t2 = (location, outputCollection, filter, endobrev) => [
  // filter out nulls
  {
    $match: {
      year: { $ne: 0 },
      state: { $ne: null },
      [location]: { $ne: null },
    },
  },
  // user-passed filter
  ...(filter ? [{ $match: filter }] : {}),

  // fit the shape of data to only update spots
  {
    $project: {
      _id: 0,
      endobrev: { $literal: endobrev },
      spotst2: '$spotst0', // rename
      state: 1,
      year: { $sum: ['$year', 2] }, // lookahead of 2 years
      [location]: 1,
    },
  },
  {
    $merge: {
      into: outputCollection,
      on: ['year', 'state', location, 'endobrev'],
      whenMatched: 'merge',
      whenNotMatched: 'discard',
    },
  },
];

/**
 * @description function to generate mongo pipeline for year-1 or year-2 passes to set spots & clerids
 * @param {String} timescale t0 t1 or t2
 */
export const offsetYearPassCreator = (timescale) => {
  switch (timescale) {
    case 't1':
      return t1;
    case 't2':
      return t2;
    default:
      return undefined;
  }
};

/**
 * @description higher-order function for generating indicator variables
 * @param {String} location either 'county' or 'rangerDistrict'
 * @param {mongoose.Model} Model destination model to write to
 * @param {Function} upsertOp an upsert operation to do bulkwrites with
 * @returns {(filter: Object) => Promise}
 */
export const indicatorGeneratorCreator = (location, Model, upsertOp) => async (filter = {}) => {
  const data = await Model.find(filter);

  const indicators = data.map((doc) => {
    const {
      endobrev,
      spbPer2Weeks,
      spotst0,
      spotst1,
      spotst2,
      state,
      year,
      [location]: loc,
    } = doc;

    const hasSPBTrapping = spbPer2Weeks !== null;
    const isValidForPrediction = hasSPBTrapping && spotst1 !== null && spotst2 !== null;
    const hasSpotst0 = spotst0 !== null;
    const hasPredictionAndOutcome = isValidForPrediction && hasSpotst0;

    return {
      year,
      state,
      [location]: loc,
      endobrev,
      hasSPBTrapping: +hasSPBTrapping, // convert boolean to 1 or 0
      isValidForPrediction: +isValidForPrediction, // convert boolean to 1 or 0
      hasSpotst0: +hasSpotst0, // convert boolean to 1 or 0
      hasPredictionAndOutcome: +hasPredictionAndOutcome, // convert boolean to 1 or 0
    };
  });

  // upsert results into db
  const writeOp = indicators.map(upsertOp);
  return Model.bulkWrite(writeOp);
};

/**
 * higher-order function to create a prediction generator
 * @param {String} location either 'county' or 'rangerDistrict'
 * @param {Function} ScriptRunner service to execute the model running
 * @param {mongoose.Model} Model destination model to write to
 * @param {Function} upsertOp an upsert operation to do bulkwrites with
 * @returns {(filter: Object) => Promise}
 */
export const predictionGeneratorCreator = (location, ScriptRunner, Model, upsertOp) => async (filter = {}) => {
  const data = await Model.find({
    ...filter,
    isValidForPrediction: 1,
  });

  const rawInputs = data.map((doc) => {
    const {
      cleridst1,
      endobrev,
      spbPer2Weeks: SPB,
      spotst1,
      spotst2,
      state,
      year,
      [location]: loc,
    } = doc;

    const inputValues = [SPB, cleridst1, spotst1, spotst2, endobrev];

    const allValidInput = inputValues.reduce((acc, curr) => (
      acc && (curr === null || curr >= 0)
    ), true);

    if (!allValidInput) return null;

    return {
      state,
      year,
      [location]: loc,
      endobrev,
      SPB,
      spotst1,
      spotst2,
      cleridst1,
    };
  });

  // remove missing entries
  const inputs = rawInputs.filter((obj) => !!obj);
  const allPredictions = await ScriptRunner(inputs);

  // reformat and insert corresponding predictions object at the same index
  const updatedData = inputs.map((doc, index) => {
    const {
      endobrev,
      state,
      year,
      [location]: loc,
    } = doc;

    const {
      expSpotsIfOutbreak,
      mu,
      pi,
      probSpotsGT0,
      probSpotsGT20,
      probSpotsGT50,
      probSpotsGT150,
      probSpotsGT400,
      probSpotsGT1000,
    } = allPredictions[index];

    return {
      endobrev,
      state,
      year,
      [location]: loc,
      pi,
      mu,
      expSpotsIfOutbreak: !Number.isNaN(Math.round(expSpotsIfOutbreak)) ? Math.round(expSpotsIfOutbreak) : null,
      probSpotsGT0,
      probSpotsGT1000,
      probSpotsGT150,
      probSpotsGT20,
      probSpotsGT400,
      probSpotsGT50,
    };
  });

  // upsert results into db
  const writeOp = updatedData.map(upsertOp);
  return Model.bulkWrite(writeOp);
};

/**
 * higher-order function to create a calculated field generator
 * @param {String} location either 'county' or 'rangerDistrict'
 * @param {Function} ScriptRunner service to execute the model running
 * @param {mongoose.Model} Model destination model to write to
 * @param {Function} upsertOp an upsert operation to do bulkwrites with
 * @returns {(filter: Object) => Promise}
 */
export const calculatedFieldsGeneratorCreator = (location, ScriptRunner, Model, upsertOp) => async (filter = {}) => {
  const data = await Model.find(filter);

  const rawInputs = data.map((doc) => {
    const {
      cleridsPer2Weeks,
      endobrev,
      probSpotsGT50,
      spbPer2Weeks,
      spotst0,
      state,
      year,
      [location]: loc,
    } = doc;

    return {
      endobrev,
      state,
      year,
      [location]: loc,
      cleridsPer2Weeks,
      probSpotsGT50,
      spbPer2Weeks,
      spotst0,
    };
  });

  // remove missing entries
  const inputs = rawInputs.filter((obj) => !!obj);
  const allCalculatedFields = await ScriptRunner(inputs);

  // reformat and insert corresponding predictions object at the same index
  const updatedData = inputs.map((doc, index) => {
    const {
      endobrev,
      state,
      year,
      [location]: loc,
    } = doc;

    const {
      'ln(cleridsPer2Weeks+1)': lnClerids,
      'ln(spbPer2Weeks+1)': lnSPB,
      'ln(spotst0+1)': lnSpots,
      'logit(Prob>50)': logitProb,
      predSpotslogUnits,
      predSpotsorigUnits,
      residualSpotslogUnits,
    } = allCalculatedFields[index];

    return {
      endobrev,
      state,
      year,
      [location]: loc,
      'ln(cleridsPer2Weeks+1)': lnClerids,
      'ln(spbPer2Weeks+1)': lnSPB,
      'ln(spotst0+1)': lnSpots,
      'logit(Prob>50)': logitProb,
      predSpotslogUnits,
      predSpotsorigUnits: !Number.isNaN(Math.round(predSpotsorigUnits)) ? Math.round(predSpotsorigUnits) : null,
      residualSpotslogUnits,
    };
  });

  // upsert results into db
  const writeOp = updatedData.map(upsertOp);
  return Model.bulkWrite(writeOp);
};
