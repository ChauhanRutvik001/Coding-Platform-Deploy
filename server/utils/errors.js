import { StatusCodes } from "http-status-codes";

export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
    this.status = StatusCodes.NOT_FOUND;
    this.message = message;
  }
}

export class BadRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = "BadRequestError";
    this.status = StatusCodes.BAD_REQUEST;
    this.message = message;
  }
}

export class ForbiddenError extends Error {
  constructor(message) {
    super(message);
    this.name = "ForbiddenError";
    this.status = StatusCodes.FORBIDDEN;
    this.message = message;
  }
}

export class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = "UnauthorizedError";
    this.status = StatusCodes.UNAUTHORIZED;
    this.message = message;
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.status = StatusCodes.UNPROCESSABLE_ENTITY;
    this.message = message;
  }
}

export class InternalServerError extends Error {
  constructor(message) {
    super(message);
    this.name = "InternalServerError";
    this.status = StatusCodes.INTERNAL_SERVER_ERROR;
    this.message = message;
  }
}
