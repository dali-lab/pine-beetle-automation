import { Router } from 'express';

import {
  generateResponse,
  RESPONSE_TYPES,
} from '../constants';

const healthcheckRouter = Router();

healthcheckRouter.route('/')
  .get((_req, res) => {
    res.send(generateResponse(RESPONSE_TYPES.SUCCESS));
  });

export default healthcheckRouter;
