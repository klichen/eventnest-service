import express, { type Request, type Response } from "express";
import cors from "cors";
import "dotenv/config";
import instagramTokenRoutes from "./routes/instagramTokenRoutes";
import clubsRoutes from "./routes/clubsRoutes";
import { requireApiKey } from "./middlewares/apiKeyAuth";
import swaggerUi from "swagger-ui-express";
import { buildOpenAPIDocument } from "./utils/openapi/build";
import { limiter } from "./utils/rateLimit";

const openapiDoc = buildOpenAPIDocument();

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

// work with ngrok
app.set("trust proxy", 1);

/* ─────────────  generic middleware  ───────────── */
app.use(cors(corsOptions));
app.use(express.json());
app.use(limiter);

/* ─────────────  PUBLIC routes first  ───────────── */

// API docs
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(openapiDoc, {
    explorer: false,
    swaggerOptions: {
      persistAuthorization: true, // optional
      docExpansion: "list",
    },
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "EventNest API",
  })
);

app.get("/openapi.json", (_req, res) => {
  res.json(openapiDoc);
});

// instagram token/authorization routes - club leaders will hit this endpoint to give us instagram permissions
app.use("/api/auth", instagramTokenRoutes);

/* ─────────────  API-key guard  ───────────── */
app.use(requireApiKey);

/* ─────────────  PROTECTED routes  ───────────── */
app.use("/api/clubs", clubsRoutes);
// app.use("/api/events");

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Listening on Port ${PORT}`);
});
