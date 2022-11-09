import { Request, Response, NextFunction } from 'express'
import { CustomError } from '@fl/errors'

/**
 * Custom error middleware to standardize error objects returned to
 * the client
 *
 * @param err Error caught by Express.js
 * @param req Request object provided by Express
 * @param res Response object provided by Express
 * @param next NextFunction function provided by Express
 */
export const error = (err: TypeError | CustomError, req: Request, res: Response, next: NextFunction) => {
  let customError = err

  if (!(err instanceof CustomError)) {
    customError = new CustomError(err.message)
  }

  console.error(customError)
  res.status((customError as CustomError).statusCode).send(customError)
}
