import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { analyzeUploadedPdf } from "../material-analysis";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Material-Id, X-Material-Name",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.post("/api/material-analysis", express.raw({ type: "application/pdf", limit: "50mb" }), async (req, res) => {
    const materialId = String(req.header("X-Material-Id") ?? "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
    const fileName = String(req.header("X-Material-Name") ?? "material.pdf");
    if (!materialId || !Buffer.isBuffer(req.body) || req.body.length === 0) {
      res.status(400).json({ message: "Envie um PDF válido para análise." });
      return;
    }
    try {
      const result = await analyzeUploadedPdf({ materialId, fileName, bytes: req.body });
      res.json(result);
    } catch (error) {
      console.error("[material-analysis]", error);
      const detail = error instanceof Error ? error.message.toLowerCase() : "";
      const message = detail.includes("storage") || detail.includes("signed")
        ? "O PDF chegou ao Dino, mas o armazenamento não ficou disponível. Tente reenviar em alguns instantes."
        : detail.includes("llm") || detail.includes("model") || detail.includes("análise")
          ? "O PDF foi recebido, mas a IA não conseguiu concluir a leitura agora. Mantenha o app aberto e tente novamente."
          : "Não foi possível concluir a análise do PDF agora. Confira sua conexão e tente novamente.";
      res.status(502).json({ message });
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);
