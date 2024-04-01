import * as dotenv from "dotenv"
import msal, { LogLevel } from '@azure/msal-node';
import { type Request } from 'express';
import axios from 'axios';
import app from '../app';

dotenv.config();

import AccessTokenModel from '../models/accessToken';

const msalConfig = {
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID_V2 ?? '',
    authority: process.env.MICROSOFT_AUTHORITY_V2,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET_V2,
  },
  system: {
    loggerOptions: {
      loggerCallback(_loglevel: any, message: any, _containsPii: any) {
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: LogLevel.Verbose,
    },
  },
};

export const authWithMicrosoftService = async (req: Request): Promise<string> => {
    app.locals.msalClient = new msal.ConfidentialClientApplication(msalConfig);
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
  
    const url = await req.app.locals.msalClient.getAuthCodeUrl(
      authCodeUrlParameters,
    );
    return url;
  };
  
  export const callbackMicrosoftService = async (
    req: Request,
    user: string,
  ): Promise<Record<string, unknown>> => {
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
  
    const response = await req.app.locals.msalClient.acquireTokenByCode(
      tokenRequest,
    );
  
    const { accessToken } = response;
  
    const refreshToken = async (): Promise<any> => {
      const tokenCache = await req.app.locals.msalClient
        .getTokenCache()
        .serialize();
  
      const refreshTokenObject = JSON.parse(tokenCache).RefreshToken;
  
      const myRefreshToken =
        refreshTokenObject[Object.keys(refreshTokenObject)[0]].secret;
  
      return myRefreshToken;
    };
  
    const tokens = {
      accessToken,
      refreshToken: await refreshToken(),
    };
  
    const appExists = await AccessTokenModel.find({
      user,
      email: response.account.username,
    });
  
    if (appExists.length > 0) {
      throw new Error('App already installed..');
    }
  
    await AccessTokenModel.create({
      user,
      email: response.account.username,
      accessToken: response.accessToken,
      refreshToken: tokens.refreshToken,
      provider: 'microsoft',
      expiryTime: response.expiresOn,
    });
  
    return response;
  };

// Function to refresh access token using refresh token
const refreshAccessToken = async (
  refreshToken: string,
  req: Request,
): Promise<Record<string, unknown>> => {
  app.locals.msalClient = new msal.ConfidentialClientApplication(msalConfig);
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
    const response = await req.app.locals.msalClient.acquireTokenByRefreshToken(
      refreshTokenRequest,
    );

    console.log('response', response);

    const refreshToken2 = async (): Promise<any> => {
      const tokenCache = await req.app.locals.msalClient
        .getTokenCache()
        .serialize();

      console.log('tokenCache', tokenCache);

      const refreshTokenObject = JSON.parse(tokenCache).RefreshToken;

      const myRefreshToken =
        refreshTokenObject[Object.keys(refreshTokenObject)[0]].secret;

      return myRefreshToken;
    };

    const updatedCredentials = {
      newAccesssToken: response?.accessToken,
      newRefreshToken: await refreshToken2(),
      newExpiresOn: response?.expiresOn,
    };

    return updatedCredentials;
  } catch (error) {
    // Handle token refresh failure
    throw new Error(error as string | undefined);
  }
};

//Get all calendar service
const getAllCalendarServices = async (
  req: Request,
  user: string,
): Promise<any> => {
  const account = await AccessTokenModel.findOne({
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

    await AccessTokenModel.findOneAndUpdate(
      { user, provider: 'microsoft' },
      {
        accessToken: newTokens.newAccessToken,
        expiryTime: newTokens.newExpiresOn,
      },
      { new: true, runValidators: true, sort: { createdAt: -1 } },
    );

    const newAccount = await AccessTokenModel.findOne({
      user,
      provider: 'microsoft',
    })
      .sort({ createdAt: -1 })
      .limit(1);

    // Use the new access token to make the request
    const calendarsResponse = await axios.get(
      'https://graph.microsoft.com/v1.0/me/calendars',
      {
        headers: {
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          Authorization: `Bearer ${newAccount?.accessToken}`,
        },
      },
    );
    return calendarsResponse.data;
  }

  const calendarsResponse = await axios.get(
    'https://graph.microsoft.com/v1.0/me/calendars',
    {
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
      },
    },
  );

  return calendarsResponse.data;
};

export {
  getAllCalendarServices,
};
