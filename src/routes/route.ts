import express from "express";

const {
    authWithMicrosoftController,
    callbackMicrosoftController,
    getAllCalendarsController 
} = require('../controllers/controller');

export const calenRouter = express.Router();

calenRouter.get('/install', authWithMicrosoftController);
calenRouter.get('/callback', callbackMicrosoftController);
calenRouter.post("/calendars", getAllCalendarsController);