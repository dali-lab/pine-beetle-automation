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

## `POST /unsummarized-trapping/upload`

Uploads a CSV file to the unsummarized dataset.

Expects `form-data` body with key `csv` and value of the uploaded file.

## `GET /unsummarized-trapping/download`

Sends CSV of entire unsummarized trapping collection

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
