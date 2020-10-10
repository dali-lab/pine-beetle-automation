## `GET /spot-data/`

Returns all spot data.

## `POST /spot-data/`

Creates new entry for spot data. Requires auth.

Expects the following in the body:

- `county`
- `fips`
- `hostAc`
- `rangerDistrict`
- `spbCount`
- `spots`
- `state`
- `year`

## `POST /spot-data/upload`

Uploads a CSV file to the spot dataset.

Expects `form-data` body with key `csv` and value of the uploaded file.

## `GET /spot-data/download`

Sends CSV of entire spot data collection.

## `GET /spot-data/merge/county`

Appends spot data to summarized data by county. Expects the following optional query parameters:

- `year`

If year is missing, then the pipeline will run for the entire dataset. Otherwise, it will only do one year.

## `GET /spot-data/merge/rangerDistrict`

Appends spot data to summarized data by ranger district. Expects the following optional query parameters:

- `year`

If year is missing, then the pipeline will run for the entire dataset. Otherwise, it will only do one year.

## `GET /spot-data/:id`

Gets a row of spot data by its unique id.

## `PUT /spot-data/:id`

Updates a row of spot data by its unique id. Requires auth.

Expects the following in the body:

- `county`
- `fips`
- `hostAc`
- `rangerDistrict`
- `spbCount`
- `state`
- `year`

Null values will be ignored.

## `DELETE /spot-data/:id`

Deletes a row of spot data by its unique id. Requires auth.
