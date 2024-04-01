"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCalendarsController = exports.callbackMicrosoftController = exports.authWithMicrosoftController = void 0;
const service_1 = require("../services/service");
const authWithMicrosoftController = async (req, res) => {
    try {
        const url = await (0, service_1.authWithMicrosoftService)(req);
        res.json(url);
    }
    catch (error) {
        console.log('error', error);
        if (error.response.status !== 200) {
            return res.status(error.response.status).json(error.response.data.error);
        }
        return res.status(500).json(error.response.data);
    }
};
exports.authWithMicrosoftController = authWithMicrosoftController;
const callbackMicrosoftController = async (req, res) => {
    try {
        const user = 'user@outlook.com';
        const response = await (0, service_1.callbackMicrosoftService)(req, user);
        res.json(response);
    }
    catch (error) {
        console.log('error', error);
        if (error.response.status !== 200) {
            return res.status(error.response.status).json(error.response.data.error);
        }
        return res.status(500).json(error.response.data);
    }
};
exports.callbackMicrosoftController = callbackMicrosoftController;
const getAllCalendarsController = async (req, res) => {
    try {
        const user = 'user@outlook.com';
        const allCalendars = await (0, service_1.getAllCalendarServices)(req, user);
        return res.status(200).json(allCalendars);
    }
    catch (error) {
        console.log('error', error);
        if (error.response.status !== 200) {
            return res.status(error.response.status).json(error.response.data.error);
        }
        return res.status(500).json(error.response.data);
    }
};
exports.getAllCalendarsController = getAllCalendarsController;
