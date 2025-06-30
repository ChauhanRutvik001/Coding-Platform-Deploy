import { NotFoundError } from "../utils/errors.js";

const notFoundHandler = (req, res, next) => {
  next(new NotFoundError("Page not found"));
};

export default notFoundHandler;
