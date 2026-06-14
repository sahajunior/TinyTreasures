import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

const auth = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new ApiError(401, "Access token required");
  }

  const token = header.split(" ")[1];
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    throw new ApiError(401, "Invalid or expired access token");
  }
};

export default auth;
