import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";

const isProduction = process.env.NODE_ENV === "production";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? "none" : "strict") as "none" | "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

const CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? "none" : "strict") as "none" | "strict",
  path: "/",
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      res.status(400).json({ success: false, message: "All fields required" });
      return;
    }

    if (!["buyer", "seller"].includes(role)) {
      res.status(400).json({ success: false, message: "Role must be buyer or seller" });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
      return;
    }

    const result = await authService.register(email, password, name, role);
    res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
    res.status(201).json({
      success: true,
      data: { user: result.user, accessToken: result.accessToken },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: "Email and password required" });
      return;
    }

    const result = await authService.login(email, password);
    res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
    res.json({
      success: true,
      data: { user: result.user, accessToken: result.accessToken },
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({ success: false, message: "Refresh token required" });
      return;
    }

    const result = await authService.refresh(token);
    res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
    res.json({
      success: true,
      data: { accessToken: result.accessToken },
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await authService.logout(token);
    }
    res.clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS);
    res.json({ success: true, message: "Logged out" });
  } catch (err) {
    next(err);
  }
};
