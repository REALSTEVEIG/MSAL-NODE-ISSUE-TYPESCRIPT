import {
    getAllCalendarServices,
    authWithMicrosoftService,
    callbackMicrosoftService,
  } from '../services/service';
  import { type Request, type Response } from 'express';

 export const authWithMicrosoftController = async (
    req: Request,
    res: Response,
  ): Promise<any> => {
    try {
      const url = await authWithMicrosoftService(req);
      res.json(url);
    } catch (error: any) {
        console.log('error', error);
        if (error.response.status !== 200) {
          return res.status(error.response.status).json(error.response.data.error);
        }
        return res.status(500).json(error.response.data);
      }
    };
  
 export const callbackMicrosoftController = async (
    req: Request,
    res: Response,
  ): Promise<any> => {
    try {
      const user = 'user@outlook.com';
      const response = await callbackMicrosoftService(req, user!);
      res.json(response);
    } catch (error: any) {
        console.log('error', error);
        if (error.response.status !== 200) {
          return res.status(error.response.status).json(error.response.data.error);
        }
        return res.status(500).json(error.response.data);
      }
    };
  
  export const getAllCalendarsController = async (
    req: Request,
    res: Response,
  ): Promise<any> => {
    try {
      const user = 'user@outlook.com';
      const allCalendars = await getAllCalendarServices(req, user);
      return res.status(200).json(allCalendars);
    } catch (error: any) {
      console.log('error', error);
      if (error.response.status !== 200) {
        return res.status(error.response.status).json(error.response.data.error);
      }
      return res.status(500).json(error.response.data);
    }
  };