export const aggregationPipelineCreator = (location, collection) => [
  // filter out docs that are recorded on the other geographical organization
  // (RD for county, county for RD)
  {
    $match: { [location]: { $ne: null } },
  },
  // select sums, group by county/RD, state, year
  {
    $group: {
      _id: {
        [location]: `$${location}`,
        state: '$state',
        year: '$year',
      },
      cleridCount: { $sum: '$cleridCount' },
      spbCount: { $sum: '$spbCount' },
    },
  },
  // reformat the data, remove messy _id and allow mongo to regenerate it
  {
    $project: {
      _id: 0,
      cleridCount: 1,
      [location]: `$_id.${location}`,
      spbCount: 1,
      state: '$_id.state',
      year: '$_id.year',
    },
  },
  // output and join on collection
  {
    $merge: {
      into: collection,
      on: [location, 'state', 'year'],
      whenMatched: 'keepExisting',
    },
  },
];

export const matchStateYear = (state, year) => [
  {
    $match: { state, year },
  },
];
