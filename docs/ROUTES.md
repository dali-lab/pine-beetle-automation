# Server Routes

## `GET /healthcheck`

Returns 200 response when server is up

## `GET /r-model`

Returns output of R model. Expects the following query parameters:

- `SPB`
- `cleridst1`
- `spotst1`
- `spotst2`
- `endobrev`

Defaults each parameter to 0 when not supplied.

## `GET /summarized-county-trapping`

Returns all summarized county trapping data.

## `POST /summarized-county-trapping`

Creates new entry for summarized county trapping data. Requires auth.

Expects the following in the body:

- `state`
- `county`
- `year`
- `spbCount`
- `cleridCount`

## `GET /summarized-county-trapping/filter`

Returns a filtered slice of the summarized county trapping data. Expects the following query parameters:

- `startYear`
- `endYear`
- `state`
- `county`

Null parameters are ok; the filter will simply ignore them.

## `GET /summarized-county-trapping/:id`

Gets a row of summarized county trapping data by its unique id.

## `PUT /summarized-county-trapping/:id`

Updates a row of summarized county trapping data by its unique id.

Expects the following in the body:

- `state`
- `county`
- `year`
- `spbCount`
- `cleridCount`

Missing values will be ignored.

## `DELETE /summarized-county-trapping/:id`

Deletes a row of summarized trapping data by its unique id.

## `GET /summarized-rangerdistrict-trapping`

Returns all summarized ranger district trapping data.

## `POST /summarized-rangerdistrict-trapping`

Creates new entry for summarized ranger district trapping data. Requires auth.

Expects the following in the body:

- `state`
- `rangerDistrict`
- `year`
- `spbCount`
- `cleridCount`

## `GET /summarized-rangerdistrict-trapping/filter`

Returns a filtered slice of the summarized ranger district trapping data. Expects the following query parameters:

- `startYear`
- `endYear`
- `state`
- `rangerDistrict`

Missing parameters is ok; the filter will simply ignore them.

## `GET /summarized-rangerdistrict-trapping/:id`

Gets a row of summarized ranger district trapping data by its unique id.

## `PUT /summarized-rangerdistrict-trapping/:id`

Updates a row of summarized ranger district trapping data by its unique id.

Expects the following in the body:

- `state`
- `rangerDistrict`
- `year`
- `spbCount`
- `cleridCount`

Missing values will be ignored.

## `DELETE /summarized-rangerdistrict-trapping/:id`

Deletes a row of summarized trapping data by its unique id.

## `GET /unsummarized-trapping/`

Returns all unsummarized trapping data.

## `POST /unsummarized-trapping/`

Creates new entry for unsummarized trapping data. Requires auth.

Expects the following in the body:

- `bloom` String
- `bloomDate` Date
- `cleridCount` Number
- `collectionDate` Date
- `county` String
- `daysActive` String
- `endobrev` Number
- `fips` Number
- `latitude` Number
- `longitude` Number
- `lure` String
- `rangerDistrict` String
- `season` String
- `sirexLure` String
- `spbCount` Number
- `startDate` Date
- `state` String
- `trap` String
- `week` Number
- `year` Number

## `GET /unsummarized-trapping/:id`

Gets a row of unsummarized trapping data by its unique id.

## `PUT /unsummarized-trapping/:id`

Updates a row of unsummarized trapping data by its unique id. Requires auth.

Expects the following in the body:

- `bloom` String
- `bloomDate` Date
- `cleridCount` Number
- `collectionDate` Date
- `county` String
- `daysActive` String
- `endobrev` Number
- `fips` Number
- `latitude` Number
- `longitude` Number
- `lure` String
- `rangerDistrict` String
- `season` String
- `sirexLure` String
- `spbCount` Number
- `startDate` Date
- `state` String
- `trap` String
- `week` Number
- `year` Number

Null values will be ignored.

## `DELETE /unsummarized-trapping/:id`

Deletes a row of unsummarized trapping data by its unique id. Requires auth.
