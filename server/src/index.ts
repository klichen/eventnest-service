import express, { type Request, type Response } from "express";
import cors from "cors";
import "dotenv/config";
import instagramTokenRoutes from "./routes/instagramTokenRoutes";

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

app.use(cors(corsOptions));
app.use(express.json());

// instagram token/authorization routes
app.use("/api/auth", instagramTokenRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Listening on Port ${PORT}`);
});
