import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { loadJson } from "./data/loadJson.js";
import { recommendBuild } from "./generator/recommendationEngine.js";

const DEFAULT_DATA_PATH = "data/app/base-game-data.json";
const PUBLIC_DIR = resolve("public");
const PORT = Number(process.env.PORT ?? 4173);
const DATA_PATH = process.env.DATA_PATH ?? DEFAULT_DATA_PATH;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const gameData = await loadJson(resolve(DATA_PATH));

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "POST" && request.url === "/api/recommend") {
      await handleRecommend(request, response);
      return;
    }

    await serveStatic(request, response);
  } catch (error) {
    response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error.message }));
  }
});

server.listen(PORT, () => {
  console.log(`PoE2 Build Generator running at http://localhost:${PORT}`);
  console.log(`Using data: ${DATA_PATH}`);
});

async function handleRecommend(request, response) {
  const body = await readRequestBody(request);
  const payload = JSON.parse(body || "{}");
  const query = String(payload.query ?? "").trim();

  if (!query) {
    response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: "Build request is required." }));
    return;
  }

  const result = recommendBuild(query, gameData);
  response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(result));
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const requestedPath = resolve(join(PUBLIC_DIR, pathname));

  if (!requestedPath.startsWith(PUBLIC_DIR)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const content = await readFile(requestedPath);
    response.writeHead(200, { "content-type": MIME_TYPES[extname(requestedPath)] ?? "text/plain; charset=utf-8" });
    response.end(content);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}

function readRequestBody(request) {
  return new Promise((resolveBody, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => resolveBody(body));
    request.on("error", reject);
  });
}
