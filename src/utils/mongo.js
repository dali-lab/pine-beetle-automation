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
  // select total days, and beetles per trap, group by county/rd, trap name, state, year
  {
    $group: {
      _id: {
        [location]: `$${location}`,
        state: '$state',
        trap: '$trap',
        year: '$year',
      },
      cleridCount: { $sum: '$cleridCount' },
      spbCount: { $sum: '$spbCount' },
      totalDaysActive: { $sum: '$daysActive' },
    },
  },
  // select beetle counts, trap count, beetles per day per trap, group by county/RD, state, year
  {
    $group: {
      _id: {
        [location]: `$_id.${location}`,
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
      spbCount: { $sum: '$spbCount' },
      spbPerDay: { // this creates an array, which is casted during project to object
        $push: {
          k: '$_id.trap',
          v: { $divide: ['$spbCount', '$totalDaysActive'] },
        },
      },
      trapCount: { $sum: 1 },
    },
  },
  // reformat the data, remove messy _id and allow mongo to regenerate it, reduce arrays to objects
  {
    $project: {
      _id: 0,
      cleridCount: 1,
      cleridPerDay: { // cast k,v array to object
        $arrayToObject: '$cleridPerDay',
      },
      [location]: `$_id.${location}`,
      spbCount: 1,
      spbPerDay: { // cast k,v array to object
        $arrayToObject: '$spbPerDay',
      },
      state: '$_id.state',
      trapCount: 1,
      year: '$_id.year',
    },
  },
  // output and merge into collection
  {
    $merge: {
      into: collection,
      on: [location, 'state', 'year'],
      whenMatched: 'replace',
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

export const mergeSpotDataCreator = (location, collection) => [
  // filter out docs that are recorded on the other geographical organization
  // (RD for county, county for RD)
  {
    $match: { [location]: { $ne: null } },
  },
  {
    $lookup: {
      as: 'spotinfo',
      from: 'spotdatas',
      pipeline: [
        {
          $match: {
            [location]: `$${location}`,
            state: '$state',
            year: '$year',
          },
        },
        {
          $project: {
            _id: 0,
            // state: 0,
            // county: 0,
            // rangerDistrict:0,
            // fips: 0,
            spots: 1,
          },
        },
      ],
    },
  },
  {
    $replaceWith: {
      $mergeObjects: [
        '$$ROOT',
        { spots: '$spotinfo.spots' },
      ],
    },
  },
  {
    $project: {
      spotinfo: 0,
      // _id: 0,
      // county: 1,
      // rangerDistrict: 1,
      // state: 1,
      // fips: 0,
      // spots: 1,
    },
  },
  // output and merge into collection
  // {
  //   $merge: {
  //     into: collection,
  //     on: [location, 'state', 'year'],
  //     whenMatched: 'replace',
  //   },
  // },
];
