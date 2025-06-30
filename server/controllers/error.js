import { StatusCodes } from "http-status-codes";

const errorHandler = (err, req, res, next) => {
  const error = {
    status: err.status || StatusCodes.INTERNAL_SERVER_ERROR,
    name: err.name || "UnknownError",
    msg: err.message || "Something went worng!",
  };
  res.status(error.status).json(error);
};

export default errorHandler;
