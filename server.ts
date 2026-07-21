import express from "express";
import path from "path";
import cors from "cors";
import Razorpay from "razorpay";
import { createServer as createViteServer } from "vite";
import fs from "fs";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Dynamic Metadata Route for /register to handle social media previews (e.g. WhatsApp)
app.get("/register", async (req, res, next) => {
  const projectId = "gen-lang-client-0774589767";
  const databaseId = "ai-studio-selvalakshmifoun-06cf7884-eb4f-48b6-b930-3989fc202d2d";
  const courseId = req.query.course as string;

  let title = "Selvalakshmi Institute";
  let description = "Join our upcoming naturopathy and Muthra acupressure batches.";
  let imageUrl = "";
  let videoUrl = "";

  if (courseId) {
    try {
      const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/courses/${encodeURIComponent(courseId)}`);
      if (response.ok) {
        const data = await response.json();
        const fields = data.fields || {};
        
        const courseTitle = fields.title?.stringValue || "";
        const courseDescription = fields.description?.stringValue || "";
        const courseFee = fields.fee?.stringValue || "";
        const courseDuration = fields.duration?.stringValue || "";
        const courseVideoUrl = fields.videoUrl?.stringValue || "";
        
        if (courseTitle) {
          title = courseTitle;
          
          let feesText = courseFee;
          if (feesText && !feesText.toLowerCase().includes('free') && !feesText.includes('₹')) {
            feesText = `₹${feesText}`;
          }
          
          description = `⏱️ Duration: ${courseDuration || 'N/A'} | 💰 Fee: ${feesText || 'N/A'}\n\n✨ Course Highlights:\n${courseDescription}`;
          
          if (courseVideoUrl) {
            videoUrl = courseVideoUrl;
            if (courseVideoUrl.includes("youtube.com/watch?v=")) {
              const match = courseVideoUrl.match(/v=([^&]+)/);
              if (match) {
                imageUrl = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
              }
            } else if (courseVideoUrl.includes("youtu.be/")) {
              const match = courseVideoUrl.match(/youtu\.be\/([^?&#\s]+)/);
              if (match) {
                imageUrl = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
              }
            } else if (courseVideoUrl.includes("youtube.com/embed/")) {
              const match = courseVideoUrl.match(/embed\/([^?&#\s]+)/);
              if (match) {
                imageUrl = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching course from Firestore REST:", error);
    }
  }

  // Fallback to logoUrl if image is not set yet
  if (!imageUrl) {
    try {
      const globalRes = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/settings/global`);
      if (globalRes.ok) {
        const globalData = await globalRes.json();
        const logoUrl = globalData.fields?.logoUrl?.stringValue;
        if (logoUrl) {
          imageUrl = logoUrl;
        }
      }
    } catch (err) {
      console.error("Error fetching global settings:", err);
    }
  }

  // Read index.html (depending on env)
  let htmlPath = "";
  if (process.env.NODE_ENV !== "production") {
    htmlPath = path.join(process.cwd(), "index.html");
  } else {
    htmlPath = path.join(process.cwd(), "dist", "index.html");
  }

  let html = "";
  try {
    html = fs.readFileSync(htmlPath, "utf-8");
  } catch (err) {
    console.error("Failed to read index.html:", err);
    return res.status(500).send("Internal Server Error");
  }

  // Sanitize values for inclusion in meta attributes
  const cleanTitle = title.replace(/"/g, '&quot;');
  const cleanDescription = description.replace(/"/g, '&quot;').replace(/\r?\n/g, ' ');
  const currentUrl = `https://www.selvalakshmihealtheducation.in${req.originalUrl}`;

  const metaTags = `
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="video.other" />
    <meta property="og:title" content="${cleanTitle}" />
    <meta property="og:description" content="${cleanDescription}" />
    <meta property="og:url" content="${currentUrl}" />
    ${imageUrl ? `<meta property="og:image" content="${imageUrl}" />` : ''}
    ${videoUrl ? `<meta property="og:video" content="${videoUrl}" />` : ''}
    <meta property="og:video:type" content="text/html" />
    <meta property="og:site_name" content="Selvalakshmi Institute" />
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:title" content="${cleanTitle}" />
    <meta property="twitter:description" content="${cleanDescription}" />
    ${imageUrl ? `<meta property="twitter:image" content="${imageUrl}" />` : ''}
  `;

  html = html.replace("<title>Selvalakshmi Institute</title>", `<title>${cleanTitle}</title>`);
  html = html.replace("</head>", `${metaTags}\n</head>`);

  res.send(html);
});

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
