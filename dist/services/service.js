"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCalendarServices = exports.callbackMicrosoftService = exports.authWithMicrosoftService = void 0;
const dotenv = __importStar(require("dotenv"));
const msal_node_1 = __importStar(require("@azure/msal-node"));
const axios_1 = __importDefault(require("axios"));
const app_1 = __importDefault(require("../app"));
dotenv.config();
const accessToken_1 = __importDefault(require("../models/accessToken"));
const msalConfig = {
    auth: {
        clientId: process.env.MICROSOFT_CLIENT_ID_V2 ?? '',
        authority: process.env.MICROSOFT_AUTHORITY_V2,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET_V2,
    },
    system: {
        loggerOptions: {
            loggerCallback(_loglevel, message, _containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal_node_1.LogLevel.Verbose,
        },
    },
};
const authWithMicrosoftService = async (req) => {
    app_1.default.locals.msalClient = new msal_node_1.default.ConfidentialClientApplication(msalConfig);
    const authCodeUrlParameters = {
        scopes: [
            'user.read',
            'calendars.readwrite',
            'mailboxsettings.read',
            'offline_access',
        ],
        prompt: 'consent',
        redirectUri: process.env.MICROSOFT_REDIRECT_URI_V2,
    };
    const url = await req.app.locals.msalClient.getAuthCodeUrl(authCodeUrlParameters);
    return url;
};
exports.authWithMicrosoftService = authWithMicrosoftService;
const callbackMicrosoftService = async (req, user) => {
    const tokenRequest = {
        code: req.query.code,
        scopes: [
            'user.read',
            'calendars.readwrite',
            'mailboxsettings.read',
            'offline_access',
        ],
        accessType: 'offline',
        redirectUri: process.env.MICROSOFT_REDIRECT_URI_V2,
    };
    const response = await req.app.locals.msalClient.acquireTokenByCode(tokenRequest);
    const { accessToken } = response;
    const refreshToken = async () => {
        const tokenCache = await req.app.locals.msalClient
            .getTokenCache()
            .serialize();
        console.log('tokenCache', tokenCache);
        const refreshTokenObject = JSON.parse(tokenCache).RefreshToken;
        const myRefreshToken = refreshTokenObject[Object.keys(refreshTokenObject)[0]].secret;
        return myRefreshToken;
    };
    const tokens = {
        accessToken,
        refreshToken: await refreshToken(),
    };
    const appExists = await accessToken_1.default.find({
        user,
        email: response.account.username,
    });
    if (appExists.length > 0) {
        throw new Error('App already installed..');
    }
    await accessToken_1.default.create({
        user,
        email: response.account.username,
        accessToken: response.accessToken,
        refreshToken: tokens.refreshToken,
        provider: 'microsoft',
        expiryTime: response.expiresOn,
    });
    return response;
};
exports.callbackMicrosoftService = callbackMicrosoftService;
// Function to refresh access token using refresh token
const refreshAccessToken = async (refreshToken, req) => {
    app_1.default.locals.msalClient = new msal_node_1.default.ConfidentialClientApplication(msalConfig);
    const refreshTokenRequest = {
        scopes: [
            'user.read',
            'calendars.readwrite',
            'mailboxsettings.read',
            'offline_access',
        ],
        accessType: 'offline',
        refreshToken,
    };
    try {
        const response = await req.app.locals.msalClient.acquireTokenByRefreshToken(refreshTokenRequest);
        console.log('response', response);
        const refreshToken2 = async () => {
            const tokenCache = await req.app.locals.msalClient
                .getTokenCache()
                .serialize();
            console.log('tokenCache', tokenCache);
            const refreshTokenObject = JSON.parse(tokenCache).RefreshToken;
            const myRefreshToken = refreshTokenObject[Object.keys(refreshTokenObject)[0]].secret;
            return myRefreshToken;
        };
        const updatedCredentials = {
            newAccesssToken: response?.accessToken,
            newRefreshToken: await refreshToken2(),
            newExpiresOn: response?.expiresOn,
        };
        return updatedCredentials;
    }
    catch (error) {
        // Handle token refresh failure
        throw new Error(error);
    }
};
//Get all calendar service
const getAllCalendarServices = async (req, user) => {
    const account = await accessToken_1.default.findOne({
        user,
        provider: 'microsoft',
    })
        .sort({ createdAt: -1 })
        .limit(1);
    if (!account) {
        return {
            errorCode: 'missing-access-token',
            statusCode: 403,
            message: 'Kindly authorize the microsoft App to continue',
        };
    }
    if (account.expiryTime.getTime() < Date.now()) {
        const newTokens = await refreshAccessToken(account.refreshToken, req);
        await accessToken_1.default.findOneAndUpdate({ user, provider: 'microsoft' }, {
            accessToken: newTokens.newAccessToken,
            expiryTime: newTokens.newExpiresOn,
        }, { new: true, runValidators: true, sort: { createdAt: -1 } });
        const newAccount = await accessToken_1.default.findOne({
            user,
            provider: 'microsoft',
        })
            .sort({ createdAt: -1 })
            .limit(1);
        // Use the new access token to make the request
        const calendarsResponse = await axios_1.default.get('https://graph.microsoft.com/v1.0/me/calendars', {
            headers: {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                Authorization: `Bearer ${newAccount?.accessToken}`,
            },
        });
        return calendarsResponse.data;
    }
    const calendarsResponse = await axios_1.default.get('https://graph.microsoft.com/v1.0/me/calendars', {
        headers: {
            Authorization: `Bearer ${account.accessToken}`,
        },
    });
    return calendarsResponse.data;
};
exports.getAllCalendarServices = getAllCalendarServices;
