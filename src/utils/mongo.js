/**
 * @description creates a custom aggregation pipeline for either county or RD
 * @param {String} location either 'county' or 'rangerDistrict'
 * @param {String} collection either 'summarizedcountytrappings' or 'summarizedrangerdistricttrappings'
 * @returns {Array<Object>} that should be used as ... to input into aggregate
 */
export const aggregationPipelineCreator = (location, collection) => [
  // filter out docs that are recorded on the other geographical organization
  // (RD for county, county for RD)
  {
    $match: { [location]: { $ne: null } },
  },
  // select total days, beetles per trap, group by county/rd, trap name, state, year, season, endobrev
  {
    $group: {
      _id: {
        endobrev: '$endobrev',
        [location]: `$${location}`,
        season: '$season',
        state: '$state',
        trap: '$trap',
        year: '$year',
      },
      cleridCount: { $sum: '$cleridCount' },
      spbCount: { $sum: '$spbCount' },
      totalDaysActive: { $sum: '$daysActive' },
    },
  },
  // select beetle counts, trap count, total trapping days, beetles per day per trap, group by county/RD, state, year, season, endo
  {
    $group: {
      _id: {
        endobrev: '$_id.endobrev',
        [location]: `$_id.${location}`,
        season: '$_id.season',
        state: '$_id.state',
        year: '$_id.year',
      },
      cleridCount: { $sum: '$cleridCount' },
      cleridPerDay: { // this creates an array, which is casted during project to object
        $push: {
          k: '$_id.trap',
          v: { $divide: ['$cleridCount', '$totalDaysActive'] },
        },
      },
      endobrev: { $sum: '$endobrev' },
      spbCount: { $sum: '$spbCount' },
      spbPerDay: { // this creates an array, which is casted during project to object
        $push: {
          k: '$_id.trap',
          v: { $divide: ['$spbCount', '$totalDaysActive'] },
        },
      },
      totalTrappingDays: { $sum: '$totalDaysActive' },
      trapCount: { $sum: 1 },
    },
  },
  // reformat the data, remove messy _id and allow mongo to regenerate it, reduce arrays to objects
  // calculate weighted average of total beetles over total days
  {
    $project: {
      _id: 0,
      cleridCount: 1,
      cleridPer2Weeks: { $multiply: [14, { $divide: ['$cleridCount', '$totalTrappingDays'] }] },
      cleridPerDay: { // cast k,v array to object
        $arrayToObject: '$cleridPerDay',
      },
      endobrev: '$_id.endobrev',
      [location]: `$_id.${location}`,
      season: '$_id.season',
      spbCount: 1,
      spbPer2Weeks: { $multiply: [14, { $divide: ['$spbCount', '$totalTrappingDays'] }] },
      spbPerDay: { // cast k,v array to object
        $arrayToObject: '$spbPerDay',
      },
      spots: { $literal: null }, // TODO: investigate way to not overwrite this field
      state: '$_id.state',
      trapCount: 1,
      year: '$_id.year',
    },
  },
  // output and merge into collection
  {
    $merge: {
      into: collection,
      on: ['year', 'state', location, 'season', 'endobrev'],
      // whenMatched: 'replace',
    },
  },
];

/**
 * @description helper function to encapsulate aggregation filtering by a state and year
 * @param {String} state the state name
 * @param {Number} year the year
 */
export const matchStateYear = (state, year) => [
  {
    $match: { state, year },
  },
];

/**
 * @description helper function to encapsulate aggregation filtering by a year
 * @param {Number} year the year
 */
export const matchYear = (year) => [
  {
    $match: { year },
  },
];

// internal helper function to 'invert' the location
const getOtherLocation = (location) => (location === 'county' ? 'rangerDistrict' : 'county');

/* NOTE: the below technique is a very poor usage of aggregation, and I discovered that
 * directly matching Y/S/C/RD, projecting only Y/S/C/RD/spots, and directly doing a default
 * merge should accomplish all of this without needing to read and bulkwrite the data all over again.
 * this is because merge does a sort of { ...originalobject, ...mergedobject } to the document,
 * allowing us to directly insert/overwrite certain fields. Darn!
 *
 * https://docs.mongodb.com/manual/reference/operator/aggregation/merge/#merge-whenmatched-merge
 *
 * fix technique: reimplement this pipeline and break it up into a selection stage and a merge stage.
 * merge stage should be conditional on location, likely in a different function.
 * put that in instead of bulkWrite for the spot controller.
 */
/**
 * @description builds pipeline to do a join (mass populate) on a collection with spot data
 * @param {String} location the geographic grouping county/rd to work on
 */
export const mergeSpotDataCreator = (location) => [
  // filter out docs that are recorded on the other geographical organization
  // (RD for county, county for RD)
  {
    $match: { [location]: { $ne: null } },
  },
  // join from spot data collection
  {
    $lookup: {
      as: 'spotinfo',
      from: 'spotdatas',
      let: {
        [getOtherLocation(location)]: `$${getOtherLocation(location)}`,
        [location]: `$${location}`,
        state: '$state',
        year: '$year',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                {
                  $eq: [`$${location}`, `$$${location}`],
                },
                {
                  $eq: [`$${getOtherLocation(location)}`, null],
                },
                {
                  $eq: ['$state', '$$state'],
                },
                {
                  $eq: ['$year', '$$year'],
                },
              ],
            },
          },
        },
      ],
    },
  },
  // extract the correct spot document out of an array
  {
    $replaceWith: {
      $mergeObjects: [
        '$$ROOT',
        { spotdoc: { $arrayElemAt: ['$spotinfo', 0] } },
      ],
    },
  },
  // remove the spotinfo array
  {
    $project: {
      spotinfo: 0,
    },
  },
  {
    $project: {
      _id: 0,
      cleridCount: 1,
      cleridPerDay: 1,
      [location]: 1,
      spbCount: 1,
      spbPerDay: 1,
      spots: '$spotdoc.spots', // extract the number only from the doc
      state: 1,
      trapCount: 1,
      year: 1,
    },
  },
  // only modify those who have non-null spots
  {
    $match: { spots: { $ne: null } },
  },
];
