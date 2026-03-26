import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./auth";
import jwt from "jsonwebtoken";
import counterRouter from "./counter";
import { registry, httpRequestCounter, httpRequestDuration } from "./metrics";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({
    method: req.method,
    route: req.path,
  });
  res.on("finish", () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.path,
      status: res.statusCode,
    });
    end();
  });
  next();
});
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.use("/auth", authRouter);
app.use("/counter", counterRouter);

app.get("/health", (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get("/me", (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    res.json(payload);
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", registry.contentType);
  res.send(await registry.metrics());
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
