import jwt from "jsonwebtoken";
import { BadRequestError } from "./errors.js";
import { config } from "dotenv";
config({ path: "../.env"});
export const createToken = async (payload) => {
  const token = await jwt.sign(payload, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXP,
  });

  return token;
};

export const verifyToken = async (token) => {
  return await jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) throw new BadRequestError(err.msg);
    return decoded;
  });
};
