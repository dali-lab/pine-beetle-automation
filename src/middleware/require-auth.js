import axios from 'axios';

import {
  RESPONSE_CODES,
  RESPONSE_TYPES,
} from '../constants';

import { generateResponse } from '../utils';

/**
 * @description custom middleware for requiring user auth
 * @param {Object} req request object
 * @param {Object} res response object
 * @param {Function} next function for proceeding with middleware
 */
const requireAuth = async (req, res, next) => {
  let { MAIN_BACKEND_ROUTE } = process.env;
  // ensure base URL without trailing /v3 so we don't get /v3/v3/user/auth
  if (MAIN_BACKEND_ROUTE) {
    MAIN_BACKEND_ROUTE = MAIN_BACKEND_ROUTE.replace(/\/v3\/?$/, '');
  }
  const { authorization } = req.headers;

  // send unauthorized if no auth header
  if (!authorization) {
    return res.status(RESPONSE_CODES.UNAUTHORIZED.status)
      .send(generateResponse(RESPONSE_TYPES.UNAUTHORIZED));
  }

  if (!MAIN_BACKEND_ROUTE) {
    return res.status(RESPONSE_CODES.INTERNAL_ERROR.status)
      .send(generateResponse(RESPONSE_TYPES.INTERNAL_ERROR, 'MAIN_BACKEND_ROUTE is not configured'));
  }

  try {
    // auth with main backend
    const response = await axios.get(`${MAIN_BACKEND_ROUTE}/v3/user/auth`, {
      headers: {
        authorization,
      },
    });

    // proceed if successful, otherwise return forbidden
    if (response.data.status === RESPONSE_CODES.SUCCESS.status) {
      return next();
    } else {
      return res.status(RESPONSE_CODES.FORBIDDEN.status)
        .send(generateResponse(RESPONSE_TYPES.FORBIDDEN));
    }
  } catch (error) {
    return res.status(RESPONSE_CODES.FORBIDDEN.status)
      .send(generateResponse(RESPONSE_TYPES.FORBIDDEN));
  }
};

export default requireAuth;
