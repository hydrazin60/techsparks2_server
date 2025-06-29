import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";
import proxy from "express-http-proxy";
import { dbConnect } from "../../../db/dbConnect";
import dotenv from "dotenv";

dotenv.config();
const app = express();

// Database connection (remove if API gateway doesn't need direct DB access)
dbConnect().catch((err) => {
  console.error("Failed to connect to MongoDB", err);
  process.exit(1);
});

// Middlewares
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);
app.set("trust proxy", 1);

// CORS
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// Static assets
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Proxy configuration
app.use(
  "/api/auth",
  proxy("http://localhost:5000", {
    proxyReqPathResolver: (req) => {
      const newPath = req.originalUrl.replace("/api/auth", "");
      console.log(
        `Proxying: ${req.originalUrl} → http://localhost:5000${newPath}`
      );
      return newPath;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      console.log(`Proxy Response: ${proxyRes.statusCode} ${userReq.path}`);
      return proxyResData;
    },
  })
);

app.use(
  "/api/business",
  proxy("http://localhost:3333", {
    proxyReqPathResolver: (req) => {
      const newPath = req.originalUrl.replace("/api/business", "");
      console.log(
        `Proxying: ${req.originalUrl} → http://localhost:3333${newPath}`
      );
      return newPath;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      console.log(`Proxy Response: ${proxyRes.statusCode} ${userReq.path}`);
      return proxyResData;
    },
  })
);
// Default route
app.get("/", (req, res) => {
  res.status(200).json({ message: "API Gateway is running" });
});

const port = process.env.PORT || 8000;
app
  .listen(port, () => {
    console.log(`API Gateway listening at http://localhost:${port}`);
  })
  .on("error", (err) => {
    console.error("Server error:", err);
    process.exit(1);
  });
