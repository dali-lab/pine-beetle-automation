# Project Pine Beetle Automation Server

Automation server for creating pipeline between ArcGIS and MongoDB. Also used to run R model and perform (almost) all database writes.

This differs from the main server at [https://github.com/dali-lab/pine-beetle-backend](https://github.com/dali-lab/pine-beetle-backend) in that this is mostly for data and resource-intensive work. The other server is used for read operations from the frontend.

## Installation

Clone the repo and run `yarn install` in the main directory.

Run `yarn start` to run the server, `yarn dev` to run in dev mode (with live changes from `nodemon`). Run `yarn build` to package the app.

Note: make sure to implement the correct `.env` file located in the DALI Pine Beetle slack channel.

## Server Capabilities

System is linked with ArcGIS System and automatically adds trapping record when a survey result is submitted.
Gathering required data for the trappings table (clerids and SPB per/day average).
Performing calculations on the obtained information.
Verifying connection with MongoDB by uploading test information.

**See all server routes [here](./docs/ROUTES.md)**.
