import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "25mb" }));

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
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

  app.post("/api/gemini/generate", async (req, res) => {
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
  });

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
