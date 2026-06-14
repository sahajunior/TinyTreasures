import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

const requireRole = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, "Insufficient permissions");
    }
    next();
  };
};

export default requireRole;
