import express, { type Request, type Response } from "express";
import cors from "cors";
import "dotenv/config";

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

/**
 * POST /exchange-code
 * Receives the authorization code from the client and exchanges it for a short-lived access token and then a long-lived one.
 */
app.post("/exchange-for-token", async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) {
    res.status(400).json({ error: "Authorization code is missing" });
  }

  // Prepare the form data as URL-encoded values
  const params = new URLSearchParams();
  params.append("client_id", process.env.CLIENT_ID as string);
  params.append("client_secret", process.env.CLIENT_SECRET as string);
  params.append("grant_type", "authorization_code");
  params.append("redirect_uri", process.env.REDIRECT_URI as string);
  params.append("code", code);

  try {
    // get short-lived token
    const shortLivedResponse = await fetch(
      "https://api.instagram.com/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      }
    );

    if (!shortLivedResponse.ok) {
      const errorData = await shortLivedResponse.json();
      console.error("Error exchanging code for token:", errorData);
      res.status(shortLivedResponse.status).json({
        error: "Failed to exchange code for token",
        details: errorData,
      });
    }

    const shortLivedToken: {
      access_token: string;
      user_id: string;
      permissions: string;
    } = await shortLivedResponse.json();
    console.log("SHORT LIVED TOKEN:", shortLivedToken);

    // get long-lived token (60 days valid)
    const longLivedResponse = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.CLIENT_SECRET}&access_token=${shortLivedToken.access_token}`,
      {
        method: "GET",
      }
    );

    if (!longLivedResponse.ok) {
      const errorData = await longLivedResponse.json();
      console.error("Error exchanging for long-lived token:", errorData);
      res.status(longLivedResponse.status).json({
        error: "Failed to exchange for long-lived token",
        details: errorData,
      });
    }

    const longLivedToken: {
      access_token: string;
      token_type: string;
      expires_in: string;
    } = await longLivedResponse.json();
    console.log("LONG-LIVED TOKEN:", longLivedToken);

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error exchanging code for token:", error.message);
    res.status(500).json({ error: "Failed to exchange code for token" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Listening on Port ${PORT}`);
});
