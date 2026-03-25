import { Router } from "express";
import { createClient } from "redis";
import { pool } from "./db";
import { requireAuth, AuthRequest } from "./middleware";
import { incrementCounter, cooldownRejections } from "./metrics";

const router = Router();

const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});
redis.connect().catch(console.error);

const COOLDOWN_SECONDS = 60 * 60; // 1 hour

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT value FROM counter WHERE id = 1");
    res.json({ count: rows[0].value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get count" });
  }
});

router.post("/increment", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;

  try {
    const cooldownKey = `cooldown:${userId}`;
    const ttl = await redis.ttl(cooldownKey);

    if (ttl > 0) {
      cooldownRejections.inc();
      res.status(429).json({ error: "Cooldown active", remainingSeconds: ttl });
      return;
    }

    await pool.query("UPDATE counter SET value = value + 1 WHERE id = 1");

    await pool.query("INSERT INTO increments (user_id) VALUES ($1)", [userId]);

    await redis.set(cooldownKey, "1", { EX: COOLDOWN_SECONDS });

    incrementCounter.inc();

    const { rows } = await pool.query("SELECT value FROM counter WHERE id = 1");

    res.json({ count: rows[0].value, remainingSeconds: COOLDOWN_SECONDS });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to increment" });
  }
});

router.get("/cooldown", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;

  try {
    const cooldownKey = `cooldown:${userId}`;
    const ttl = await redis.ttl(cooldownKey);
    res.json({ remainingSeconds: ttl > 0 ? ttl : 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get cooldown" });
  }
});

export default router;
