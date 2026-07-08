import express from "express";
import path from "path";
import cors from "cors";
import Razorpay from "razorpay";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Initialize Razorpay lazily
let razorpayClient: Razorpay | null = null;
function getRazorpay(): Razorpay {
  if (!razorpayClient) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
      throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables are required to process payments");
    }
    razorpayClient = new Razorpay({ key_id, key_secret });
  }
  return razorpayClient;
}

// Payment endpoint 
app.post("/api/create-razorpay-order", async (req, res) => {
  try {
    const razorpay = getRazorpay();
    const { amount, currency = "INR" } = req.body; 

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error: any) {
    console.error("Razorpay error:", error);
    if (error.message && error.message.includes("RAZORPAY")) {
      return res.status(500).json({ error: "Payment gateway is not fully configured. Missing Razorpay Keys." });
    }
    res.status(500).json({ error: error.message || "Failed to create Razorpay order" });
  }
});

app.get("/api/razorpay-key", (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID || "" });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Setup Vite middleware for local development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
