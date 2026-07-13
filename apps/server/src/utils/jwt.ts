import jwt from "jsonwebtoken";
import process from "node:process";
import "dotenv/config";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

export const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET);
};
