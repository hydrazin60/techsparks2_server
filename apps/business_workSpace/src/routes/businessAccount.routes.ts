import { isAuthenticated } from "../../../../packages/middleware/IsAuthenticated";
import { createBusinessAccount } from "./../controllers/businessAccount.controller";
import express from "express";
const businessAccountRoutes = express.Router();
businessAccountRoutes.post(
  "/create/statup_account",
  isAuthenticated,
  createBusinessAccount
);
export default businessAccountRoutes;
