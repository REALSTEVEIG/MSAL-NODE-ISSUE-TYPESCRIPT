import express from "express";

import {
    authWithMicrosoftController,
    callbackMicrosoftController,
    getAllCalendarsController,
} from "../controllers/controller"

export const calenRouter = express.Router();

calenRouter.get('/install', authWithMicrosoftController);
calenRouter.get('/callback', callbackMicrosoftController);
calenRouter.get('/calendars', getAllCalendarsController);