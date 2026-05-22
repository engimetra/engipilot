import { Response } from "express"
import { ApiResponse } from "@/shared/types"

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode = 200,
  meta?: Record<string, unknown>,
): Response => {
  const body: ApiResponse<T> = { success: true, data, message, ...(meta ? { meta } : {}) }
  return res.status(statusCode).json(body)
}

export const sendCreated = <T>(res: Response, data: T, message = "Created"): Response =>
  sendSuccess(res, data, message, 201)

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  errors?: unknown,
): Response => {
  const body: ApiResponse = { success: false, message, ...(errors ? { errors } : {}) }
  return res.status(statusCode).json(body)
}

export const sendNotFound  = (res: Response, resource = "Resource"): Response =>
  sendError(res, `${resource} not found`, 404)

export const sendUnauthorized = (res: Response, message = "Unauthorized"): Response =>
  sendError(res, message, 401)

export const sendForbidden = (res: Response, message = "Forbidden"): Response =>
  sendError(res, message, 403)

export const sendServerError = (res: Response, message = "Internal server error"): Response =>
  sendError(res, message, 500)
