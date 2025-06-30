import User from "../models/user.js";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";
import { verifyToken } from "../utils/jwt.js";

export const isAuthorized = async (req, res, next) => {
  if (!req.headers.cookie) throw new UnauthorizedError("please login!");
  // console.log(req.headers.cookie);

  const cookies = req.headers.cookie.split(";").reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split("=");
    acc[name] = value;
    return acc;
  }, {});
  const token = cookies.token;

  if (!token) throw new UnauthorizedError("Token not found");
  const decoded = await verifyToken(token);
  const user = await User.findById(decoded.id, { password: 0 });

  // console.log("-->", user.sessionId, "-->", decoded.sessionId)
  if (!user || user.sessionId !== decoded.sessionId) {
    throw new UnauthorizedError(
      "Invalid or expired session. Please log in again."
    );
  }
  req.user = {
    id: user._id,
    isAdmin: user.role,
  };
  next();
};

export const isAdmin = (req, res, next) => {
  console.log("->", req.user);
  if (req.user && req.user.isAdmin === "admin") {
    // Allow access if the user is an admin
    return next();
  }
  // Deny access if the user is not an admin
  throw new ForbiddenError("You are not allowed to access this route");
};

export const isFaculty = (req, res, next) => {
  console.log("=+-->", req.user);
  if (req.user && req.user.isAdmin === "faculty") {
    // Allow access if the user is an faculty
    return next();
  }
  // Deny access if the user is not an faculty
  throw new ForbiddenError("You are not allowed to access this route");
};

export const isAdminOrFaculty = (req, res, next) => {
  console.log("=+-->", req.user);

  if (req.user.isAdmin !== "faculty" && req.user.isAdmin !== "admin") {
    console.log("Unauthorized Access");
    return res
      .status(403)
      .json({ message: "You are not allowed to access this route" });
  }

  next(); // Proceed to the next middleware/controller
};
