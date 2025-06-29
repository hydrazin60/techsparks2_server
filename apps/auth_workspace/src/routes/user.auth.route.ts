import express from "express";
import {
  LoginUser,
  resetUserPassword,
  userForgetPassword,
  UserRegistration,
  verifyUserForgetPassswordOTP,
  verifyUserOTP,
  ViewOwnProfile,
} from "../controllers/user.auth.controller";
import { isAuthenticated } from "../../../../packages/middleware/IsAuthenticated";

const authRouter = express.Router();
authRouter.post("/register", UserRegistration);
authRouter.post("/verify-otp", verifyUserOTP);
authRouter.post("/login", LoginUser);
authRouter.post("/forget_password", userForgetPassword);
authRouter.post("/verify_forget_password/token", verifyUserForgetPassswordOTP);
authRouter.post("/reset_password", resetUserPassword);
authRouter.get("/view/own_profile", isAuthenticated, ViewOwnProfile);
export default authRouter;
