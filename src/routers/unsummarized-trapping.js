import { Router } from 'express';

import {
    generateResponse,
    RESPONSE_CODES,
    RESPONSE_TYPES,
  } from '../constants';

import { UnsummarizedTrappingModel } from "../controllers";

const unsummarizedTrappingRouter = Router()

unsummarizedTrappingRouter.route('/')
    .get(async (req, res) => { // get all unsummarized data
        try {
            const documents = await UnsummarizedTrappingModel.getAll();
            res.send(generateResponse(RESPONSE_TYPES.SUCCESS, documents));
        } catch (error) {
            console.log(error);
            res.status(RESPONSE_CODES.INTERNAL_ERROR.status)
            .send(generateResponse(RESPONSE_TYPES.INTERNAL_ERROR, error));
        }
    })
    
    .post(async (req, res) => { // add a new document to collection
        try {
            const documents = await UnsummarizedTrappingModel.insertOne(req.body);
            res.send(generateResponse(RESPONSE_TYPES.SUCCESS, documents));
        } catch (error) {
            res.status(RESPONSE_CODES.INTERNAL_ERROR.status)
            .send(generateResponse(RESPONSE_TYPES.INTERNAL_ERROR, error));
        }
    });

unsummarizedTrappingRouter.route('/:id')
    .get(async (req, res) => { // get a document by its unique id
        try {
            const documents = await UnsummarizedTrappingModel.getById(req.params.id);
            res.send(generateResponse(RESPONSE_TYPES.SUCCESS, documents));
        } catch (error) {
            console.log(error);
            res.status(RESPONSE_CODES.INTERNAL_ERROR.status)
            .send(generateResponse(RESPONSE_TYPES.INTERNAL_ERROR, error));
        }
    })

    .put(async (req, res) => { // modify a document by its unique id
        try {
            const documents = await UnsummarizedTrappingModel.updateById(req.params.id, req.body);
            res.send(generateResponse(RESPONSE_TYPES.SUCCESS, documents));
        } catch (error) {
            res.status(RESPONSE_CODES.INTERNAL_ERROR.status)
            .send(generateResponse(RESPONSE_TYPES.INTERNAL_ERROR, error));
        }
    })
    
    .delete((async (req, res) => { // delete a document by its unique id
        try {
            const documents = await UnsummarizedTrappingModel.deleteById(req.params.id);
            res.send(generateResponse(RESPONSE_TYPES.SUCCESS, documents));
        } catch (error) {
            res.status(RESPONSE_CODES.INTERNAL_ERROR.status)
            .send(generateResponse(RESPONSE_TYPES.INTERNAL_ERROR, error));
        }
    })
);


export default unsummarizedTrappingRouter;