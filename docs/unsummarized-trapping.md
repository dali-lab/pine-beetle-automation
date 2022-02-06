# `/unsummarized-trapping` routes

## `GET /unsummarized-trapping/`

Returns all unsummarized trapping data.

## `POST /unsummarized-trapping/`

Creates new entry for unsummarized trapping data. Requires auth.

Accepts the following in the body (omitted values set to `null`):

- `bloom` String
- `bloomDate` Date
- `cleridCount` Number
- `collectionDate` Date
- `county` String
- `daysActive` String
- `endobrev` Number
- `FIPS` Number
- `globalID` String
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

## `DELETE /unsummarized-trapping/`

Deletes all unsummarized trapping data. Requires auth.

## `GET /unsummarized-trapping/filter`

Returns a filtered slice of the unsummarized trapping data. Accepts the following query parameters:

- `startYear`
- `endYear`
- `state`
- `county`
- `rangerDistrict`

## `GET /unsummarized-trapping/download`

Sends CSV of entire unsummarized trapping collection

## `GET /unsummarized-trapping/:id`

Gets a row of unsummarized trapping data by its unique id.

## `PUT /unsummarized-trapping/:id`

Updates a row of unsummarized trapping data by its unique id. Requires auth.

Accepts the following in the body (omitted values ignored):

- `bloom` String
- `bloomDate` Date
- `cleridCount` Number
- `collectionDate` Date
- `county` String
- `daysActive` String
- `endobrev` Number
- `FIPS` Number
- `globalID` String
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

## `DELETE /unsummarized-trapping/:id`

Deletes a row of unsummarized trapping data by its unique id. Requires auth.
