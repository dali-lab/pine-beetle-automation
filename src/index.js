import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import routers from './routers';

import { RESPONSE_CODES, RESPONSE_TYPES } from './constants';
import { generateResponse } from './utils';

dotenv.config({ silent: true });

// DB Setup
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost/pb-dev';

const mongooseOptions = {
  loggerLevel: 'error',
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

mongoose.connect(mongoURI, mongooseOptions).then(() => {
  console.log('connected to database');
}).catch((err) => {
  console.log('error: could not connect to db:', err);
});

// initialize
const app = express();

// enable cross origin resource sharing
app.use(cors());

// additional header specifications
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// enable/disable http request logging
app.use(morgan('dev'));

// enable json message body for posting data to API, extend default size limit
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({ extended: true, limit: '50mb' }));

// ROUTES
Object.entries(routers).forEach(([prefix, router]) => {
  app.use(`/v2/${prefix}`, router);
});

// custom 404 middleware
app.use((_req, res) => {
  res.status(RESPONSE_CODES.NOT_FOUND.status).send(generateResponse(
    RESPONSE_TYPES.NOT_FOUND,
    'The requested route does not exist',
  ));
});

// START THE SERVER
// =============================================================================
const port = process.env.PORT || 9090;
app.listen(port);

console.log(`listening on: ${port}`);
