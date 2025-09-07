import { rateLimit } from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 30000, // 30
  limit: 60, // each IP can make up to 60 requests every 30s
  standardHeaders: true,
  legacyHeaders: false,
});
