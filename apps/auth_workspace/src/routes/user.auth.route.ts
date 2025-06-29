import express from "express";
import {
  LoginUser,
  UserRegistration,
  verifyUserOTP,
} from "../controllers/user.auth.controller";
const authRouter = express.Router();
authRouter.post("/register", UserRegistration);
authRouter.post("/verify-otp", verifyUserOTP);
authRouter.post("/login", LoginUser);
export default authRouter;
