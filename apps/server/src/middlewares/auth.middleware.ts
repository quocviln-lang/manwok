import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";
import { sendResponse } from "../utils/response.js";

export interface AuthRequest extends Request {
  user?: { id: string };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction): any => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return sendResponse(res, 401, false, "Not authorized, no token provided");
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return sendResponse(res, 401, false, "Not authorized, invalid token");
  }
};
