// apps/auth_workSpace/src/main.ts
import express from "express";
import bodyParser from "body-parser";
import { dbConnect } from "../../../db/dbConnect";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/user.auth.route";
dotenv.config();
const app = express();

app.use(express.json());
// Database connection
dbConnect().catch((err) => {
  console.error("Failed to connect to MongoDB", err);
  process.exit(1);
});

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Error handling
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Auth service error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

cors({
  origin: "http://localhost:3000", // ❌ Not allowed with credentials: true
  credentials: true, // ❌ Causes issue with wildcard
  methods: ["GET", "POST", "PUT", "DELETE"],
});

// Routes
app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello API from auth workspace" });
});
app.use("/user/auth", authRouter);

const port = process.env.AUTH_PORT || 5000;
app
  .listen(port, () => {
    console.log(`Auth service listening at http://localhost:${port}`);
  })
  .on("error", (err) => {
    console.error("Auth service failed to start:", err);
    process.exit(1);
  });
