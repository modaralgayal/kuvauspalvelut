import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8001;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use("/api/user", userRoutes);

app.get("/", (req, res) => {
  res.json("IM NOT PLAYIN ON MY PHONE IM TAKING CARE OF BUSINESS");
});

app.get("/api/test", (req, res) => {
  console.log("Test endpoint hit");
  res.json({ message: "This is a test." });
});

app.use((err, req, res, next) => {
  console.error("Error is here: ", err.message);
  res.status(500).json({ error: "Something went wrong!" });
});

app.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);
