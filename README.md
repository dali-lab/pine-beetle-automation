# Project Pine Beetle Automation Server

This is a Node/Express server for data storage, aggregation, and analysis for Project Pine Beetle.

## Project Overview

Project Pine Beetle is a web application that visualizes data on Southern Pine Beetle outbreaks in 16 states across the US. This tool uses a predictive model to predict future outbreaks and movements of Southern Pine Beetles.

On the frontend, this application provides valuable information for USFS researchers and state forest rangers to see information related to past outbreaks and predictions about future outbreaks. This application also provides information to the general public about threats facing their communities.

On the backend, this application aggregates data collected from USFS and state forest rangers on outbreaks and beetle counts, then uses those values to display historical data and future predictions. The predictive model used to generate predictions is written in R. All data is stored in a MongoDB database, allowing for easy pre and post-processing. Using an Express server, all calculations are made in JavaScript (outside of the predictive model and Mongo summarization/aggregation algorithms), and all data is stored in JSON format.

Project Pine Beetle is a collaboration between Professor Matt Ayres of Dartmouth College, Professor Carissa Aoki of Bates College, the United States Forest Service (USFS), and the Dartmouth Applied Learning and Innovation (DALI) Lab.

## Architecture

We have two backend servers that are used for handling various functionality. Our [main backend server](https://github.com/dali-lab/pine-beetle-backend) is used to perform CRUD operations with the database. It also handles all authentication processes. The frontend sends most requests to this server. Our [automation server](https://github.com/dali-lab/pine-beetle-automation) is used for aggregating data from the USFS and restructuring it to our data format. Data comes from the USFS via several webhooks from [Survey123](https://survey123.arcgis.com/). See each of these repositories for more information.

## Setup

You must have [Node](https://nodejs.org) and [yarn](https://yarnpkg.com/) installed to run this project, as well as R language.

1. Clone the repository
2. `yarn install`
3. Add a `.env` file and paste in the necessary contents (see Handoff Document for this)
4. `yarn dev` to run in the local development environment

The `init.R` script, which is responsible for installing the jsonlite package, won't run automatically on local machine, so it needs to be run manually. In order to do it, open the R shell by typing `R` in the terminal, then use command `install.packages('jsonlite')`. This will allow to run predictions on local machine.

To develop on the webhook locally, use the "pine beetle prediction ngrok" webhook on Survey123. First install ngrok in whichever ecosystem you prefer. We found that it's easiest to get an ngrok account and API key, so you can login to the ngrok software to use additional command line flags. 

The necessary flags, to ensure that POST requests work with OPTIONS preflight requests, is `ngrok http --host-header=rewrite 9091` for http on port 9091.

## API Documentation

**See all server routes [here](./docs/ROUTES.md)**.

## Repository Structure

```
src/
    constants/                      [all constants and mapping files]
    controllers/                    [controllers to execute CRUD logic and aggregation/prediction wrappers]
    middleware/                     [Express middleware shared between multiple routes (only auth at the moment)]
    models/                         [Mongoose models for database]
    r-scripts/                      [statistical models written in R to calculate predictions]
    routers/                        [Express routers to handle route logic]
    utils/                          [various shared logic components e.g. csv parsing, MongoDB aggregation, prediction calculation]
    index.js                        [script to start the node servere
docs/                               [documentation on route API and specific processes]
testing/                            [small test script for checking predictions]
.babelrc                            [babel setup]
.eslintrc                           [eslint setup]
init.R                              [R script to install jsonlite package during deployment]
package.json                        [package]
Procfile                            [Heroku file to configure server deployment]
```

## Code Style

We use async/await for all asynchronous functions.

We use higher-order functions with dependency injection for behaviors repeated across several kinds of data.

## Deployment

Continuous deployment is setup with Heroku.

Merging a PR to the `dev` branch will trigger a new build in the dev environment. When the build passes, an update will be released at [https://pine-beetle-prediction-dev.herokuapp.com](https://pine-beetle-prediction-dev.herokuapp.com).

Merging a PR to the `release` branch will trigger a new build in the production environment. When the build passes, an update will be released at [https://pine-beetle-prediction.herokuapp.com](https://pine-beetle-prediction.herokuapp.com).

Pull requests should always be first merged into the `dev` branch so they are staged in the development environment. After smoke testing the changes in the development environment, developers can then choose to release those changes into production by generating a `DEV TO RELEASE` pull request from the `dev` branch to the `release` branch. One this single PR is merged into `release`, the changes will be built into the production environment and will be accessible at the release API.

## Contributors

- Jeff Liu

### Past Project Members

- Thomas Monfre
- Grace Wang
- Maria Cristoforo
- Alex Lopez
- Angela Zhang
- Nathan Schneider
- John McCambridge
- Madeline Hess
- Isabel Hurley
- Anuj Varma
- Emma Langfitt
