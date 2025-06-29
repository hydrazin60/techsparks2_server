// import express from "express";
// import * as path from "path";
// import { dbConnect } from "../../../db/dbConnect";
// import productRoutes from "./routes/product.routes";

// const app = express();

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// dbConnect().catch((err) => {
//   console.error("Failed to connect to MongoDB", err);
//   process.exit(1);
// });

// app.use("/assets", express.static(path.join(__dirname, "assets")));

// app.use("/api/v1/techsparks2/products", productRoutes);
// app.get("/", (req, res) => {
//   res.send({ message: "Welcome to product_workspace!" });
// });

// const port = process.env.PORT || 4444;
// const server = app.listen(port, () => {
//   console.log(`Listening at http://localhost:${port}`);
// });
// server.on("error", console.error);

import express from "express";
import * as path from "path";
import { dbConnect } from "../../../db/dbConnect";
import productRoutes from "./routes/product.routes";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

const app = express();

cors({
  origin: "*", // ❌ Not allowed with credentials: true
  credentials: true, // ❌ Causes issue with wildcard
  methods: ["GET", "POST", "PUT", "DELETE"],
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
dbConnect().catch((err) => {
  console.error("Failed to connect to MongoDB", err);
  process.exit(1);
});

// Static files
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Routes
app.use("/routes", productRoutes);
app.get("/", (req, res) => {
  res.send({ message: "Welcome to product_workspace!" });
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
  }
);

const port = process.env.PORT || 4444;
const server = app.listen(port, () => {
  console.log(`Product service listening at http://localhost:${port}`);
});

server.on("error", console.error);
