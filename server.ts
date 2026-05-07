import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { initExcelService } from "./server/excelService.js";
import apiRouter from "./server/routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize backend services (load Excel data)
  try {
    initExcelService();
    console.log("[Server] Backend services initialized successfully");
  } catch (error) {
    console.error("[Server] Failed to initialize backend services:", error);
    console.warn("[Server] API endpoints will return empty data");
  }

  // Mounting API routes
  app.use("/api", apiRouter);

  // Vite / Static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  return app;
}

// For local development
if (process.env.NODE_ENV !== "production") {
  startServer().then(app => {
    app.listen(3000, "0.0.0.0", () => {
      console.log(`[Local] Server running on http://localhost:3000`);
    });
  });
}

let cachedApp: any = null;

// For Vercel / Serverless
export default async (req: any, res: any) => {
  if (!cachedApp) {
    cachedApp = await startServer();
  }
  return cachedApp(req, res);
};
