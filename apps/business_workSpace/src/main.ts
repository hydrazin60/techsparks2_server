import express from "express";
import * as path from "path";
import businessAccountRoutes from "./routes/businessAccount.routes";
import { dbConnect } from "../../../db/dbConnect";
import statupRoutes from "./routes/statup.routes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

dbConnect().catch((err) => {
  console.error("Failed to connect to MongoDB", err);
  process.exit(1);
});
app.use("/assets", express.static(path.join(__dirname, "assets")));

app.use("/api/v1/techsparks2/businessAccounnts", businessAccountRoutes);
app.use("/api/v1/techsparks2/startup", statupRoutes);
app.get("/", (req, res) => {
  res.send({ message: "Welcome to business_workSpace!" });
});

const port = process.env.PORT || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
server.on("error", console.error);
