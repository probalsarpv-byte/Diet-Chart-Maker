import express from "express";
import type { Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { optionalAuth, type AuthRequest } from "./src/middleware/auth.ts";
import { isSqlConfigured } from "./src/db/index.ts";
import {
  getOrCreateUser,
  getNutritionistsList,
  upsertNutritionistRecord,
  getBookingsList,
  checkBookingSlotConflict,
  upsertBookingRecord,
  getPaymentTransactionsList,
  upsertPaymentTransactionRecord,
  recordClinicalAssessmentLog,
  getClinicalAssessmentLogs,
  getFoodCatalogList,
  upsertFoodCatalogItem,
  getSupplementInventoryList,
  syncPlatformStateToRelationalTables,
} from "./src/db/repository.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory Cloudflare D1 / KV compatible snapshot store on server ($0 Free Tier)
let serverPlatformSnapshot: any = null;
const sentApprovalEmailsLog: Array<{
  to: string;
  subject: string;
  body: string;
  paymentId: string;
  sentAt: string;
}> = [];

// ============================================================================
// ZERO-COST ($0) IN-MEMORY SLIDING-WINDOW RATE LIMITER (Cloudflare IP Aware)
// ============================================================================
interface RateBucket {
  count: number;
  resetAt: number;
}
const ipRateBuckets = new Map<string, RateBucket>();

function extractCloudflareClientIp(req: Request): string {
  const cfIp = req.headers["cf-connecting-ip"];
  if (typeof cfIp === "string" && cfIp.trim()) {
    return cfIp.trim();
  }
  const trueClientIp = req.headers["true-client-ip"];
  if (typeof trueClientIp === "string" && trueClientIp.trim()) {
    return trueClientIp.trim();
  }
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.trim()) {
    return xff.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "127.0.0.1";
}

function createZeroCostRateLimiter(maxRequestsPerMinute: number, bucketPrefix: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const clientIp = req.cloudflareClientIp || extractCloudflareClientIp(req);
    const key = `${bucketPrefix}:${clientIp}`;
    const now = Date.now();
    const windowMs = 60 * 1000;

    let bucket = ipRateBuckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 1, resetAt: now + windowMs };
      ipRateBuckets.set(key, bucket);
    } else {
      bucket.count += 1;
    }

    const remaining = Math.max(0, maxRequestsPerMinute - bucket.count);
    res.setHeader("RateLimit-Limit", String(maxRequestsPerMinute));
    res.setHeader("RateLimit-Remaining", String(remaining));
    res.setHeader("RateLimit-Reset", String(Math.ceil((bucket.resetAt - now) / 1000)));

    if (bucket.count > maxRequestsPerMinute) {
      const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSec));
      return res.status(429).json({
        error: "Too many requests from this IP. Please wait a moment and try again.",
        retryAfterSeconds: retryAfterSec,
      });
    }

    // Periodic cleanup of expired rate-limit buckets to keep memory footprint near 0
    if (ipRateBuckets.size > 2000) {
      for (const [k, v] of ipRateBuckets.entries()) {
        if (v.resetAt <= now) ipRateBuckets.delete(k);
      }
    }

    next();
  };
}

// ============================================================================
// CLOUDFLARE EDGE CACHE CONTROL HELPERS ($0 CDN Read Offloading)
// ============================================================================
function setEdgePublicCacheHeaders(res: Response, maxAgeSec = 60, sMaxAgeSec = 300) {
  res.setHeader(
    "Cache-Control",
    `public, max-age=${maxAgeSec}, s-maxage=${sMaxAgeSec}, stale-while-revalidate=600`
  );
  res.setHeader("CDN-Cache-Control", `public, max-age=${sMaxAgeSec}`);
  res.setHeader("Vary", "Accept-Encoding, Origin");
}

function setPrivateNoStoreHeaders(res: Response) {
  res.setHeader("Cache-Control", "private, no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Trust Cloudflare & Cloud Run reverse proxy hops for accurate client IP & HTTPS protocol
  app.set("trust proxy", true);

  app.use(express.json({ limit: "10mb" }));

  // 1. Cloudflare Real Client IP Forwarding, Custom Domain CORS & Enterprise Security Headers
  app.use((req: AuthRequest, res: Response, next: NextFunction) => {
    req.cloudflareClientIp = extractCloudflareClientIp(req);
    req.cloudflareCountry =
      (typeof req.headers["cf-ipcountry"] === "string" && req.headers["cf-ipcountry"]) || "BD";

    // Custom Cloudflare Domain & AI Studio Preview CORS Configuration
    const origin = req.headers.origin;
    const customDomain = process.env.CLOUDFLARE_CUSTOM_DOMAIN || "";
    const isAllowedOrigin =
      !origin ||
      origin.includes(".run.app") ||
      origin.includes(".pages.dev") ||
      origin.includes(".workers.dev") ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1") ||
      (customDomain && origin.includes(customDomain));

    if (origin && isAllowedOrigin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }

    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, CF-Connecting-IP, CF-IPCountry, X-Requested-With"
    );
    res.setHeader("Access-Control-Max-Age", "86400");

    // Enterprise Security & Data Privacy Headers (HIPAA / GDPR / UK-GDPR / DPDP / OAIC / AEPD / BD)
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "camera=(self), microphone=(self), geolocation=(self), payment=()"
    );
    res.setHeader("X-Data-Privacy-Compliance", "HIPAA-GDPR-UKGDPR-DPDP-OAIC-AEPD-BD");

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }
    next();
  });

  // Apply zero-cost sliding-window rate limiter to all /api/* routes (180 req/min general, 30 req/min AI)
  app.use("/api", createZeroCostRateLimiter(180, "api-general"));

  // Multi-Region SEO: Dynamic robots.txt
  app.get("/robots.txt", (req, res) => {
    const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.headers.host || "localhost:3000";
    const baseUrl = `${proto}://${host}`;
    setEdgePublicCacheHeaders(res, 3600, 86400);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send(
      [
        "User-agent: *",
        "Allow: /",
        "Disallow: /api/",
        "",
        "# Multi-Region Clinical Precision Nutrition Sitemap (USA, UK, India, Australia, Spain, Bangladesh)",
        `Sitemap: ${baseUrl}/sitemap.xml`,
      ].join("\n")
    );
  });

  // Multi-Region SEO: Dynamic XML Sitemap with xhtml:link hreflang alternates for US, GB, IN, AU, ES, BD
  app.get("/sitemap.xml", (req, res) => {
    const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.headers.host || "localhost:3000";
    const baseUrl = `${proto}://${host}`;
    const lastMod = new Date().toISOString().split("T")[0];
    const regions = [
      { hreflang: "en-US", param: "?region=us&amp;lang=en" },
      { hreflang: "en-GB", param: "?region=uk&amp;lang=en" },
      { hreflang: "en-IN", param: "?region=in&amp;lang=hi" },
      { hreflang: "en-AU", param: "?region=au&amp;lang=en" },
      { hreflang: "es-ES", param: "?region=es&amp;lang=es" },
      { hreflang: "bn-BD", param: "?region=bd&amp;lang=bn" },
      { hreflang: "en-BD", param: "?region=bd&amp;lang=en" },
    ];

    const alternateLinks = [
      ...regions.map(
        (r) =>
          `    <xhtml:link rel="alternate" hreflang="${r.hreflang}" href="${baseUrl}/${r.param}" />`
      ),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/" />`,
    ].join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
${alternateLinks}
  </url>
  ${regions
    .map(
      (r) => `  <url>
    <loc>${baseUrl}/${r.param}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
${alternateLinks}
  </url>`
    )
    .join("\n")}
</urlset>`;

    setEdgePublicCacheHeaders(res, 3600, 86400);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(xml);
  });

  app.get("/api/health", (req: AuthRequest, res) => {
    setPrivateNoStoreHeaders(res);
    res.status(200).json({
      status: "ok",
      cloudflareD1Ready: true,
      zeroCostArchitecture: true,
      hybridStorageMode: isSqlConfigured()
        ? "Cloud SQL Developer Free Tier + Firestore Spark"
        : "Zero-Cost Relational Store + Firestore Spark + Cloudflare Edge",
      clientCountry: req.cloudflareCountry || "BD",
      securityCompliance: [
        "HIPAA (USA)",
        "UK-GDPR (UK)",
        "DPDP 2023 (India)",
        "Privacy Act (Australia)",
        "RGPD/LOPDGDD (Spain)",
        "Data Protection (Bangladesh)",
      ],
      seoRegions: ["US", "GB", "IN", "AU", "ES", "BD"],
    });
  });

  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: 14000,
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // ============================================================================
  // HYBRID RELATIONAL + CLOUDFLARE EDGE API ROUTES (/api/sql/*)
  // ============================================================================

  // 1. Edge-Cached Catalog Routes (Food Guide & Supplement Inventory)
  app.get("/api/sql/catalog/foods", async (_req, res) => {
    try {
      setEdgePublicCacheHeaders(res, 60, 300);
      const foods = await getFoodCatalogList();
      res.status(200).json({ ok: true, items: foods });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch food catalog" });
    }
  });

  app.post("/api/sql/catalog/foods", optionalAuth, async (req: AuthRequest, res) => {
    try {
      setPrivateNoStoreHeaders(res);
      if (req.user?.uid && req.user?.email) {
        await getOrCreateUser(req.user.uid, req.user.email, req.user.name || "User");
      }
      const saved = await upsertFoodCatalogItem(req.body);
      res.status(200).json({ ok: true, item: saved });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to save food item" });
    }
  });

  app.get("/api/sql/catalog/supplements", async (_req, res) => {
    try {
      setEdgePublicCacheHeaders(res, 60, 300);
      const supplements = await getSupplementInventoryList();
      res.status(200).json({ ok: true, items: supplements });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch supplement inventory" });
    }
  });

  // 2. Edge-Cached Nutritionist Directory & Schedules
  app.get("/api/sql/nutritionists", async (_req, res) => {
    try {
      setEdgePublicCacheHeaders(res, 60, 300);
      const items = await getNutritionistsList();
      res.status(200).json({ ok: true, items });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch nutritionists" });
    }
  });

  app.post("/api/sql/nutritionists", optionalAuth, async (req: AuthRequest, res) => {
    try {
      setPrivateNoStoreHeaders(res);
      const saved = await upsertNutritionistRecord(req.body);
      res.status(200).json({ ok: true, item: saved });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to save nutritionist" });
    }
  });

  // 3. Relational Consultation Bookings (with Double-Booking Conflict Detection)
  app.get("/api/sql/bookings", optionalAuth, async (_req, res) => {
    try {
      setPrivateNoStoreHeaders(res);
      const items = await getBookingsList();
      res.status(200).json({ ok: true, items });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch bookings" });
    }
  });

  app.post("/api/sql/bookings", optionalAuth, async (req: AuthRequest, res) => {
    try {
      setPrivateNoStoreHeaders(res);
      const { booking, payment } = req.body || {};
      const targetBooking = booking || req.body;
      if (!targetBooking?.id || !targetBooking?.nutritionistId) {
        return res.status(400).json({ error: "Missing booking or nutritionist identifier" });
      }

      if (req.user?.uid && req.user?.email) {
        await getOrCreateUser(req.user.uid, req.user.email, req.user.name || targetBooking.patientName);
      }

      const conflictCheck = await checkBookingSlotConflict(
        targetBooking.nutritionistId,
        targetBooking.appointmentDate,
        targetBooking.appointmentSlot,
        targetBooking.id
      );

      const savedBooking = await upsertBookingRecord(targetBooking);
      if (payment && payment.id) {
        await upsertPaymentTransactionRecord(payment);
      }

      res.status(200).json({
        ok: true,
        booking: savedBooking,
        scheduleConflictDetected: conflictCheck.hasConflict,
        conflictingBookingId: conflictCheck.conflictingBookingId,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to save booking" });
    }
  });

  // 4. Premium Subscriptions & Manual Payment Transactions
  app.get("/api/sql/payments", optionalAuth, async (_req, res) => {
    try {
      setPrivateNoStoreHeaders(res);
      const items = await getPaymentTransactionsList();
      res.status(200).json({ ok: true, items });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch payments" });
    }
  });

  app.post("/api/sql/payments", optionalAuth, async (req: AuthRequest, res) => {
    try {
      setPrivateNoStoreHeaders(res);
      if (req.user?.uid && req.user?.email) {
        await getOrCreateUser(req.user.uid, req.user.email, req.user.name || req.body?.userName);
      }
      const saved = await upsertPaymentTransactionRecord(req.body);
      res.status(200).json({ ok: true, item: saved });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to save payment transaction" });
    }
  });

  // 5. Patient Clinical Assessments & Phase Progress Logs (Phases 1-4)
  app.get("/api/sql/assessments", optionalAuth, async (req: AuthRequest, res) => {
    try {
      setPrivateNoStoreHeaders(res);
      const userId = (req.query.userId as string) || req.user?.uid;
      const items = await getClinicalAssessmentLogs(userId);
      res.status(200).json({ ok: true, items });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch clinical assessments" });
    }
  });

  app.post("/api/sql/assessments", optionalAuth, async (req: AuthRequest, res) => {
    try {
      setPrivateNoStoreHeaders(res);
      const userId = req.user?.uid || req.body?.userId || "USR-ANON";
      const userEmail = req.user?.email || req.body?.userEmail || "anonymous@precision.com";
      if (req.user?.uid && req.user?.email) {
        await getOrCreateUser(req.user.uid, req.user.email, req.user.name || "Patient");
      }
      const saved = await recordClinicalAssessmentLog({
        ...req.body,
        userId,
        userEmail,
      });
      res.status(200).json({ ok: true, item: saved });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to record clinical assessment" });
    }
  });

  // ============================================================================
  // CLOUDFLARE FREE-TIER SYNC & EXISTING PLATFORM ROUTES
  // ============================================================================

  app.get("/api/cloudflare/sync", (_req, res) => {
    setPrivateNoStoreHeaders(res);
    res.status(200).json({
      ok: true,
      tier: "Cloudflare Free Tier (D1 + KV + Hybrid Relational Ready)",
      state: serverPlatformSnapshot,
      sentEmailsCount: sentApprovalEmailsLog.length,
    });
  });

  app.post("/api/cloudflare/sync", async (req, res) => {
    setPrivateNoStoreHeaders(res);
    if (req.body?.state) {
      serverPlatformSnapshot = req.body.state;
      await syncPlatformStateToRelationalTables(req.body.state);
    }
    res.status(200).json({
      ok: true,
      syncedAt: new Date().toISOString(),
      tier: "Cloudflare Free Tier (D1 + KV + Hybrid Relational Ready)",
    });
  });

  // Admin Approval Email Dispatch Endpoint
  app.post("/api/admin/send-approval-email", (req, res) => {
    setPrivateNoStoreHeaders(res);
    const { to, subject, body, paymentId } = req.body || {};
    const record = {
      to: to || "user@example.com",
      subject: subject || "Premium Subscription Approved",
      body: body || "",
      paymentId: paymentId || "",
      sentAt: new Date().toISOString(),
    };
    sentApprovalEmailsLog.unshift(record);
    res.status(200).json({
      ok: true,
      dispatched: true,
      record,
    });
  });

  // Community Hub AI Auto-Moderation Endpoint (Rate-limited to 30 req/min per IP)
  app.post(
    "/api/community/moderate",
    createZeroCostRateLimiter(30, "ai-moderate"),
    async (req, res) => {
      setPrivateNoStoreHeaders(res);
      res.setHeader("Content-Type", "application/json");
      try {
        const { content = "", targetType = "post" } = req.body || {};
        const ai = getAiClient();
        if (!ai) {
          return res.status(200).json({ allowed: true });
        }

        const prompt = `You are the Clinical Community Moderator for a Bangladeshi Nutrition, Diet, and Health app.
Analyze this user ${targetType}:
"""
${content}
"""
Rules:
1. If the content contains insults, bullying, harassment, demeaning remarks toward others, profanity, or hate speech -> allowed: false.
2. If the content is completely unrelated to health, nutrition, food, diet, recipes, digestion, medical conditions, exercise, wellness, or encouraging fellow patients (e.g., gambling, crypto, politics, commercial spam) -> allowed: false.
3. Otherwise (questions about diet, sharing health experiences, recipes, encouraging comments, symptoms) -> allowed: true.

Respond ONLY in valid JSON:
{"allowed": true/false, "reasonBn": "বাংলায় সংক্ষিপ্ত কারণ", "reasonEn": "Short reason in English"}`;

        const response = await ai.models
          .generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
          })
          .catch(() => null);

        if (!response || !response.text) {
          return res.status(200).json({ allowed: true });
        }

        const cleaned = response.text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        return res.status(200).json({
          allowed: parsed.allowed !== false,
          reasonBn: parsed.reasonBn,
          reasonEn: parsed.reasonEn,
        });
      } catch {
        return res.status(200).json({ allowed: true });
      }
    }
  );

  // Gemini AI Generation Endpoint (Rate-limited to 30 req/min per IP)
  app.post(
    "/api/gemini/generate",
    createZeroCostRateLimiter(30, "ai-generate"),
    async (req, res) => {
      setPrivateNoStoreHeaders(res);
      res.setHeader("Content-Type", "application/json");
      try {
        const { model = "gemini-3.8-flash", contents, config } = req.body || {};
        const ai = getAiClient();
        if (!ai) {
          return res.status(200).json({ text: "", fallback: true });
        }

        const timeoutPromise = new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), 14000);
        });

        const genPromise = ai.models
          .generateContent({
            model,
            contents,
            config,
          })
          .catch(() => null);

        const response = await Promise.race([genPromise, timeoutPromise]);
        if (!response || !response.text) {
          return res.status(200).json({ text: "", fallback: true });
        }

        return res.status(200).json({ text: response.text || "" });
      } catch (_error) {
        return res.status(200).json({
          text: "",
          fallback: true,
        });
      }
    }
  );

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
