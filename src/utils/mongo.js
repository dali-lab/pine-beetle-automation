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
      cleridPer2Weeks: { $multiply: [14, '$cleridAvg'] },
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

// /**
//  * @description helper function to encapsulate aggregation filtering by a state and year
//  * @param {String} state the state name
//  * @param {Number} year the year
//  */
// export const matchStateYear = (state, year) => [
//   {
//     $match: { state, year },
//   },
// ];

// /**
//  * @description helper function to encapsulate aggregation filtering by a year
//  * @param {Number} year the year
//  */
// export const matchYear = (year) => [
//   {
//     $match: { year },
//   },
// ];

// /**
//  * @description helper function to encapsulate aggregation filtering by a state
//  * @param {String} state the state name
//  */
// export const matchState = (state) => [
//   {
//     $match: { state },
//   },
// ];

// // internal helper function to 'invert' the location (unused rn)
// // const getOtherLocation = (location) => (location === 'county' ? 'rangerDistrict' : 'county');

// // protect against badly formatted data for spot merging
// const mergeGuard = (location) => ({
//   $match: {
//     year: { $ne: 0 },
//     state: { $ne: null },
//     [location]: { $ne: null },
//   },
// });

// /**
//  * @description builds pipeline to append same year spot data
//  * @param {String} location the geographic grouping county/rd to work on
//  * @param {String} outputCollection the collection to append to
//  * @param {Number} endobrev mandatory to do both 0 and 1 for merge to work
//  */
// const t0 = (location, outputCollection, endobrev) => [
//   mergeGuard(location),
//   // fit the shape of data to only update spots, fix an arbitrary endobrev
//   {
//     $project: {
//       _id: 0,
//       endobrev: { $literal: endobrev },
//       spots: 1,
//       state: 1,
//       year: 1,
//       [location]: 1,
//     },
//   },
//   {
//     $merge: {
//       into: outputCollection,
//       on: ['year', 'state', location, 'endobrev'],
//       whenMatched: 'merge',
//       whenNotMatched: 'discard',
//     },
//   },
// ];

// /**
//  * @description builds pipeline to append prior year spot data
//  * @param {String} location the geographic grouping county/rd to work on
//  * @param {String} outputCollection the collection to append to
//  * @param {Number} endobrev mandatory to do both 0 and 1 for merge to work
//  */
// const t1 = (location, outputCollection, endobrev) => [
//   mergeGuard(location),
//   // fit the shape of data to only update spots, fix an arbitrary endobrev
//   {
//     $project: {
//       _id: 0,
//       endobrev: { $literal: endobrev },
//       spotst1: '$spots', // rename
//       state: 1,
//       year: { $sum: ['$year', 1] }, // lookahead of one year
//       [location]: 1,
//     },
//   },
//   {
//     $merge: {
//       into: outputCollection,
//       on: ['year', 'state', location, 'endobrev'],
//       whenMatched: 'merge',
//       whenNotMatched: 'discard',
//     },
//   },
// ];

// /**
//  * @description builds pipeline to append 2 year ago spot data
//  * @param {String} location the geographic grouping county/rd to work on
//  * @param {String} outputCollection the collection to append to
//  * @param {Number} endobrev mandatory to do both 0 and 1 for merge to work
//  */
// const t2 = (location, outputCollection, endobrev) => [
//   mergeGuard(location),
//   // fit the shape of data to only update spots, fix an arbitrary endobrev
//   {
//     $project: {
//       _id: 0,
//       endobrev: { $literal: endobrev },
//       spotst2: '$spots', // rename
//       state: 1,
//       year: { $sum: ['$year', 2] }, // lookahead of 2 years
//       [location]: 1,
//     },
//   },
//   {
//     $merge: {
//       into: outputCollection,
//       on: ['year', 'state', location, 'endobrev'],
//       whenMatched: 'merge',
//       whenNotMatched: 'discard',
//     },
//   },
// ];

// /**
//  * helper enum to encapsulate all 3 spot joiners
//  * @param {String} timescale t0 t1 or t2
//  */
// export const mergeSpotDataCreator = (timescale) => {
//   switch (timescale) {
//     case 't0':
//       return t0;
//     case 't1':
//       return t1;
//     case 't2':
//       return t2;
//     default:
//       return undefined;
//   }
// };

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
//       cleridPer2Weeks: {
//         $last: '$cleridPer2Weeks',
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
//       cleridPer2Weeks: 1,
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
