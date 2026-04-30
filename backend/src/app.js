import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import { connectToSocket } from "./controllers/socketManager.js";
import userRoutes from "./routes/users.routes.js";
import meetingRoutes from "./routes/meetings.routes.js";

dotenv.config();

const app = express();
const server = createServer(app);

connectToSocket(server);

app.set("port", process.env.PORT || 8000);
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/meetings", meetingRoutes);

const start = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("MONGO_URI not defined in environment");
      process.exit(1);
    }

    const connectionDb = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${connectionDb.connection.host}`);

    const port = app.get("port");
    server.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (err) {
    console.error("Server startup error:", err);
    process.exit(1);
  }
};

start();

