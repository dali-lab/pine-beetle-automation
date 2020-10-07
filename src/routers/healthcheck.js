import { Router } from 'express';

import { RESPONSE_TYPES } from '../constants';
import { generateResponse } from '../utils';

const healthcheckRouter = Router();

healthcheckRouter.route('/')
  .get((_req, res) => {
    res.send(generateResponse(RESPONSE_TYPES.SUCCESS));
  });

export default healthcheckRouter;
