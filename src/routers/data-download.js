import path from 'path';
import { Router } from 'express';

import { generateErrorResponse } from '../utils';

const dataDownloadRouter = Router();

dataDownloadRouter.route('/old-data')
  .get(async (_req, res) => { // download 1988-2010 excel sheet
    try {
      res.attachment('trapping-prediction-1988-2010.xlsx')
        .sendFile(path.resolve(__dirname, '../constants/trapping-prediction-data-1988-2010.xlsx'));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

dataDownloadRouter.route('/helper-data')
  .get(async (_req, res) => { // download all helper data
    try {
      res.attachment('helper-data.zip')
        .sendFile(path.resolve(__dirname, '../constants/helper-data.zip'));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

export default dataDownloadRouter;
