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

Null parameters are ok; the filter will simply ignore them.

## `GET /summarized-rangerdistrict-trapping/aggregate`

Runs the ranger district aggregation pipeline and returns a success message. Expects the following optional query parameters:

- `state`
- `year`

If either parameter is missing, then the pipeline will run for all unsummarized data. Otherwise, it will run for an individual state and year.

## `GET /summarized-rangerdistrict-trapping/download`

Sends CSV of entire summarized ranger district trapping collection

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
