import { Request, Response, NextFunction } from "express"
import { ZodSchema, ZodError } from "zod"
import { sendError } from "@/shared/utils/response"

type Target = "body" | "query" | "params"

export function validate(schema: ZodSchema, target: Target = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target])
    if (!result.success) {
      const errors = (result.error as ZodError).flatten().fieldErrors
      sendError(res, "Validation échouée", 422, errors)
      return
    }
    req[target] = result.data
    next()
  }
}
