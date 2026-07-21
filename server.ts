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
  let courseId = req.query.course as string;
  if (courseId) {
    try {
      courseId = decodeURIComponent(courseId);
    } catch (e) {
      // already decoded or malformed
    }
  }

  let title = "Selvalakshmi Institute";
  let description = "Join our upcoming naturopathy and Muthra acupressure batches.";
  let imageUrl = "";
  let videoUrl = "";
  let videoType = "text/html";

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
        const courseImageUrl = fields.imageUrl?.stringValue || "";
        
        if (courseTitle) {
          title = courseTitle;
          
          let feesText = courseFee;
          if (feesText && !feesText.toLowerCase().includes('free') && !feesText.includes('₹')) {
            feesText = `₹${feesText}`;
          }
          
          description = `⏱️ Duration: ${courseDuration || 'N/A'} | 💰 Fee: ${feesText || 'N/A'}\n\n✨ Course Highlights:\n${courseDescription}`;
          
          if (courseImageUrl && courseImageUrl.startsWith("http")) {
            imageUrl = courseImageUrl;
          }

          if (courseVideoUrl) {
            let isYouTube = false;
            let youtubeId = "";
            
            if (courseVideoUrl.includes("youtube.com/watch?v=")) {
              isYouTube = true;
              const match = courseVideoUrl.match(/v=([^&]+)/);
              if (match) youtubeId = match[1];
            } else if (courseVideoUrl.includes("youtu.be/")) {
              isYouTube = true;
              const match = courseVideoUrl.match(/youtu\.be\/([^?&#\s]+)/);
              if (match) youtubeId = match[1];
            } else if (courseVideoUrl.includes("youtube.com/embed/")) {
              isYouTube = true;
              const match = courseVideoUrl.match(/embed\/([^?&#\s]+)/);
              if (match) youtubeId = match[1];
            }

            if (isYouTube) {
              videoUrl = youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : courseVideoUrl;
              videoType = "text/html";
              if (youtubeId && !imageUrl) {
                imageUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
              }
            } else if (courseVideoUrl.startsWith("http")) {
              videoUrl = courseVideoUrl;
              videoType = "video/mp4";
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
        if (logoUrl && logoUrl.startsWith("http")) {
          imageUrl = logoUrl;
        }
      }
    } catch (err) {
      console.error("Error fetching global settings:", err);
    }
  }

  // Double check that we don't output data URIs in open graph tags
  if (!imageUrl || imageUrl.startsWith("data:")) {
    imageUrl = "https://www.selvalakshmihealtheducation.in/whatsapp_share_preview.jpg";
  }
  if (videoUrl && videoUrl.startsWith("data:")) videoUrl = "";

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
    <meta property="og:type" content="${videoUrl ? 'video.other' : 'website'}" />
    <meta property="og:title" content="${cleanTitle}" />
    <meta property="og:description" content="${cleanDescription}" />
    <meta property="og:url" content="${currentUrl}" />
    <meta property="og:site_name" content="Selvalakshmi Institute" />
    ${imageUrl ? `
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:secure_url" content="${imageUrl}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1280" />
    <meta property="og:image:height" content="720" />
    ` : ''}
    ${videoUrl ? `
    <meta property="og:video" content="${videoUrl}" />
    <meta property="og:video:secure_url" content="${videoUrl}" />
    <meta property="og:video:type" content="${videoType}" />
    <meta property="og:video:width" content="1280" />
    <meta property="og:video:height" content="720" />
    ` : ''}
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:title" content="${cleanTitle}" />
    <meta property="twitter:description" content="${cleanDescription}" />
    ${imageUrl ? `<meta property="twitter:image" content="${imageUrl}" />` : ''}
  `;

  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${cleanTitle}</title>`);
  html = html.replace("</head>", `${metaTags}\n</head>`);

  res.send(html);
});

// Dynamic Metadata Route for / (Home / Testimony preview)
app.get(["/", "/index.html"], async (req, res, next) => {
  const projectId = "gen-lang-client-0774589767";
  const databaseId = "ai-studio-selvalakshmifoun-06cf7884-eb4f-48b6-b930-3989fc202d2d";
  let testimonyId = req.query.testimony as string;
  if (testimonyId) {
    try {
      testimonyId = decodeURIComponent(testimonyId);
    } catch (e) {
      // already decoded or malformed
    }
  }

  // If there is no testimony parameter, let Vite or static handler handle it
  if (!testimonyId) {
    return next();
  }

  let title = "Selvalakshmi Institute";
  let description = "Empower yourself with ancient holistic healing. Join our certified courses in Muthra Acupressure & Natural Foods.";
  let imageUrl = "https://www.selvalakshmihealtheducation.in/whatsapp_share_preview.jpg";
  let videoUrl = "";
  let videoType = "text/html";

  try {
    const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/testimonialVideos/${encodeURIComponent(testimonyId)}`);
    if (response.ok) {
      const data = await response.json();
      const fields = data.fields || {};
      
      const testimonialTitle = fields.title?.stringValue || "";
      const testimonialUrl = fields.url?.stringValue || "";
      
      if (testimonialTitle) {
        title = `Student Testimonial: ${testimonialTitle} | Selvalakshmi Institute`;
        description = `Watch this inspiring student testimonial from Selvalakshmi Institute. Learn how our certified courses restored balance and helped heal naturally.`;
        
        if (testimonialUrl && testimonialUrl !== "chunked") {
          let isYouTube = false;
          let youtubeId = "";
          
          if (testimonialUrl.includes("youtube.com/watch?v=")) {
            isYouTube = true;
            const match = testimonialUrl.match(/v=([^&]+)/);
            if (match) youtubeId = match[1];
          } else if (testimonialUrl.includes("youtu.be/")) {
            isYouTube = true;
            const match = testimonialUrl.match(/youtu\.be\/([^?&#\s]+)/);
            if (match) youtubeId = match[1];
          } else if (testimonialUrl.includes("youtube.com/embed/")) {
            isYouTube = true;
            const match = testimonialUrl.match(/embed\/([^?&#\s]+)/);
            if (match) youtubeId = match[1];
          }

          if (isYouTube) {
            videoUrl = youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : testimonialUrl;
            videoType = "text/html";
            if (youtubeId) {
              imageUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
            }
          } else if (testimonialUrl.startsWith("http")) {
            videoUrl = testimonialUrl;
            videoType = "video/mp4";
          }
        }
      }
    }
  } catch (error) {
    console.error("Error fetching testimonial from Firestore REST:", error);
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
    <meta property="og:type" content="${videoUrl ? 'video.other' : 'website'}" />
    <meta property="og:title" content="${cleanTitle}" />
    <meta property="og:description" content="${cleanDescription}" />
    <meta property="og:url" content="${currentUrl}" />
    <meta property="og:site_name" content="Selvalakshmi Institute" />
    ${imageUrl ? `
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:secure_url" content="${imageUrl}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1280" />
    <meta property="og:image:height" content="720" />
    ` : ''}
    ${videoUrl ? `
    <meta property="og:video" content="${videoUrl}" />
    <meta property="og:video:secure_url" content="${videoUrl}" />
    <meta property="og:video:type" content="${videoType}" />
    <meta property="og:video:width" content="1280" />
    <meta property="og:video:height" content="720" />
    ` : ''}
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:title" content="${cleanTitle}" />
    <meta property="twitter:description" content="${cleanDescription}" />
    ${imageUrl ? `<meta property="twitter:image" content="${imageUrl}" />` : ''}
  `;

  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${cleanTitle}</title>`);
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
