/* eslint-disable import/prefer-default-export */
/* eslint-disable sort-keys */
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
      cleridsPer2Weeks: { $multiply: [14, '$cleridAvg'] },
      cleridPerDay: { // cast k,v array to object
        $arrayToObject: '$cleridPerDay',
      },
      daysPerTrap: { $divide: ['$totalTrappingDays', '$trapCount'] },
      endobrev: '$_id.endobrev',
      [location]: `$_id.${location}`,
      spbCount: 1,
      spbPer2Weeks: {
        $cond: {
          if: { $eq: ['$_id.endobrev', 1] },
          then: { $multiply: [14, '$spbAvg'] },
          else: { $multiply: [{ $multiply: [14, '$spbAvg'] }, 10] },
        },
      },
      spbPer2WeeksOrig: { $multiply: [14, '$spbAvg'] },
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

// /**
//  * fetches from the specified model for predictions, filters out duplicate endo/non endo entries
//  * @param {String} location county or rangerDistrict
//  */
// export const predictionFetchCreator = (location) => [
//   // sort in order so endobrev goes 0,1
//   {
//     $sort: {
//       year: 1,
//       state: 1,
//       [location]: 1,
//       endobrev: 1,
//     },
//   },
//   // filter out duplicate endobrev
//   {
//     $group: {
//       _id: {
//         [location]: `$${location}`,
//         state: '$state',
//         year: '$year',
//       },
//       cleridPerDay: {
//         $last: '$cleridPerDay',
//       },
//       cleridsPer2Weeks: {
//         $last: '$cleridsPer2Weeks',
//       },
//       endobrev: {
//         $last: '$endobrev',
//       },
//       spbPerDay: {
//         $last: '$spbPerDay',
//       },
//       spbPer2Weeks: {
//         $last: '$spbPer2Weeks',
//       },
//       spots: {
//         $last: '$spots',
//       },
//       spotst1: {
//         $last: '$spotst1',
//       },
//       spotst2: {
//         $last: '$spotst2',
//       },
//       trapCount: {
//         $last: '$trapCount',
//       },
//     },
//   },
//   // reformat and return data
//   {
//     $project: {
//       _id: 0,
//       cleridPerDay: 1,
//       cleridsPer2Weeks: 1,
//       county: '$_id.county',
//       endobrev: 1,
//       [location]: `$_id.${location}`,
//       spbPerDay: 1,
//       spbPer2Weeks: 1,
//       spots: 1,
//       spotst1: 1,
//       spotst2: 1,
//       state: '$_id.state',
//       trapCount: 1,
//       year: '$_id.year',
//     },
//   },
// ];
