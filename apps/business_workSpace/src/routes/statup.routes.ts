import express from "express";
import { isAuthenticated } from "../../../../packages/middleware/IsAuthenticated";
import { createStartup } from "../controllers/startup.controller";

const statupRoutes = express.Router();

statupRoutes.post("/register/statup_account", isAuthenticated, createStartup);

export default statupRoutes;
