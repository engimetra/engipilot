import { Router } from "express"
import { AuthController } from "./auth.controller"
import { authenticate } from "@/middlewares/auth.middleware"
import { validate } from "@/middlewares/validate.middleware"
import { RegisterDto, LoginDto, RefreshTokenDto, ChangePasswordDto } from "./auth.dto"

const router = Router()

// Public
router.post("/register",      validate(RegisterDto),      AuthController.register)
router.post("/login",         validate(LoginDto),          AuthController.login)
router.post("/refresh",       validate(RefreshTokenDto),   AuthController.refresh)

// Protected
router.get( "/me",            authenticate,                AuthController.me)
router.post("/logout",        authenticate,                AuthController.logout)
router.patch("/password",     authenticate, validate(ChangePasswordDto), AuthController.changePassword)

export { router as authRouter }
