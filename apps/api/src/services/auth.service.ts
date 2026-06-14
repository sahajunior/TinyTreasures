import User from "../models/User";
import { ApiError } from "../utils/ApiError";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  TokenPayload,
} from "../utils/jwt";

interface AuthResult {
  user: { id: string; email: string; name: string; role: string };
  accessToken: string;
  refreshToken: string;
}

export const register = async (
  email: string,
  password: string,
  name: string,
  role: "buyer" | "seller"
): Promise<AuthResult> => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, "Email already registered");
  }

  const user = await User.create({ email, password, name, role });
  const payload: TokenPayload = { userId: user.id, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  user.refreshTokens.push(refreshToken);
  await user.save();

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    accessToken,
    refreshToken,
  };
};

export const login = async (
  email: string,
  password: string
): Promise<AuthResult> => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const payload: TokenPayload = { userId: user.id, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  user.refreshTokens.push(refreshToken);
  await user.save();

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    accessToken,
    refreshToken,
  };
};

export const refresh = async (
  oldRefreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  let payload: TokenPayload;
  try {
    payload = verifyRefreshToken(oldRefreshToken);
  } catch {
    throw new ApiError(401, "Invalid refresh token");
  }

  const user = await User.findById(payload.userId);
  if (!user) {
    throw new ApiError(401, "User not found");
  }

  const tokenIndex = user.refreshTokens.indexOf(oldRefreshToken);
  if (tokenIndex === -1) {
    // Token reuse detected — invalidate all tokens
    user.refreshTokens = [];
    await user.save();
    throw new ApiError(401, "Refresh token reuse detected");
  }

  // Rotate: remove old, add new
  user.refreshTokens.splice(tokenIndex, 1);
  const newPayload: TokenPayload = { userId: user.id, role: user.role };
  const accessToken = generateAccessToken(newPayload);
  const refreshToken = generateRefreshToken(newPayload);
  user.refreshTokens.push(refreshToken);
  await user.save();

  return { accessToken, refreshToken };
};

export const logout = async (refreshToken: string): Promise<void> => {
  let payload: TokenPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return;
  }

  const user = await User.findById(payload.userId);
  if (!user) return;

  user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
  await user.save();
};
