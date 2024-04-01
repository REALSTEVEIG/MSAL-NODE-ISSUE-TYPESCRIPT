"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calenRouter = void 0;
const express_1 = __importDefault(require("express"));
const controller_1 = require("../controllers/controller");
exports.calenRouter = express_1.default.Router();
exports.calenRouter.get('/install', controller_1.authWithMicrosoftController);
exports.calenRouter.get('/callback', controller_1.callbackMicrosoftController);
exports.calenRouter.get('/calendars', controller_1.getAllCalendarsController);
