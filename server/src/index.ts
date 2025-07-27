import express, { type Request, type Response } from "express";
import cors from "cors";
import "dotenv/config";
import instagramTokenRoutes from "./routes/instagramTokenRoutes";
import clubsRoutes from "./routes/clubsRoutes";
import { requireApiKey } from "./middlewares/apiKeyAuth";

const app = express();

const corsOptions = {
  origin: [
    process.env.CLIENT_BASE_URL || "https://localhost:3000",
    "https://www.getpostman.com",
  ], // Allow requests only from these origins
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true, // Allow cookies, if your application uses them
  optionsSuccessStatus: 204,
  // headers: 'Content-Type, Authorization, Content-Length, X-Requested-With',
};

/* ─────────────  generic middleware  ───────────── */
app.use(cors(corsOptions));
app.use(express.json());

/* ─────────────  PUBLIC routes first  ───────────── */

// instagram token/authorization routes - club leaders will hit this endpoint to give us instagram permissions
app.use("/api/auth", instagramTokenRoutes);

/* ─────────────  API-key guard  ───────────── */
// app.use(requireApiKey);

/* ─────────────  PROTECTED routes  ───────────── */
app.use("/api/clubs", clubsRoutes);
// app.use("/api/events");

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Listening on Port ${PORT}`);
});
